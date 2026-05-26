import { Component, input, output, computed } from '@angular/core';
import { BoardColumn, Task } from '../../../core/models/kanban.model';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board-columns',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './board-columns.html',
  styleUrl: './board-columns.scss'
})
export class BoardColumns {
  // --- Inputs (Signals-First) ---
  public readonly columns = input.required<BoardColumn[]>();
  public readonly tasks = input.required<Task[]>();

  // --- Outputs (Signals-First) ---
  public readonly onAddColumn = output<void>({ alias: 'addColumn' });
  public readonly onAddTask = output<{ columnId: string; status: string }>({ alias: 'addTask' });
  public readonly onViewTask = output<Task>({ alias: 'viewTask' });
  public readonly onMoveTask = output<{ taskId: string; targetColumnId: string; targetStatus: string; newOrder: number }>({ alias: 'moveTask' });

  // Computed helper to collect all droppable column IDs to coordinate connected lists
  protected readonly dropListIds = computed(() => this.columns().map((col) => col.columnId));

  // --- Helper Selectors ---
  protected getTasksForColumn(columnId: string): Task[] {
    return this.tasks().filter((task) => task.columnId === columnId);
  }

  protected getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter((subtask) => subtask.isCompleted).length;
  }

  protected triggerAddColumn(): void {
    this.onAddColumn.emit();
  }

  protected triggerAddTask(columnId: string, status: string): void {
    this.onAddTask.emit({ columnId, status });
  }

  protected triggerViewTask(task: Task): void {
    this.onViewTask.emit(task);
  }

  protected onTaskDrop(event: CdkDragDrop<Task[], any, Task>): void {
    const task = event.item.data;
    const targetColumnId = event.container.id;
    const targetColumn = this.columns().find((col) => col.columnId === targetColumnId);
    if (!targetColumn) return;

    this.onMoveTask.emit({
      taskId: task.taskId,
      targetColumnId: targetColumnId,
      targetStatus: targetColumn.name,
      newOrder: event.currentIndex
    });
  }
}
