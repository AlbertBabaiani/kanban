import { Component, input, output } from '@angular/core';
import { BoardColumn, Task } from '../../../core/models/kanban.model';

@Component({
  selector: 'app-board-columns',
  standalone: true,
  imports: [],
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
}
