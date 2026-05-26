import { Component, input, output, signal, inject } from '@angular/core';
import { Board, Task } from '../../../core/models/kanban.model';
import { KanbanService } from '../../../core/services/kanban-service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [],
  templateUrl: './task-details.html',
  styleUrl: './task-details.scss'
})
export class TaskDetails {
  private readonly kanbanService = inject(KanbanService);

  // --- Inputs ---
  public readonly task = input.required<Task>();
  public readonly activeBoard = input.required<Board>();

  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });
  public readonly onDeleteTask = output<string>({ alias: 'deleteTask' });
  public readonly onEditTask = output<Task>({ alias: 'editTask' });

  // --- Local UI Signals ---
  protected readonly isOptionsMenuOpen = signal<boolean>(false);

  // --- Computed Selectors ---
  protected getCompletedSubtasksCount(): number {
    return this.task().subtasks.filter((sub) => sub.isCompleted).length;
  }

  // --- Action Handlers ---
  protected triggerClose(): void {
    this.onClose.emit();
  }

  protected toggleOptionsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOptionsMenuOpen.update((open) => !open);
  }

  protected closeOptionsMenu(): void {
    this.isOptionsMenuOpen.set(false);
  }

  protected triggerEdit(): void {
    this.onEditTask.emit(this.task());
  }

  protected triggerDelete(): void {
    this.onDeleteTask.emit(this.task().taskId);
  }

  protected toggleSubtask(index: number): void {
    const updatedSubtasks = this.task().subtasks.map((sub, idx) => {
      if (idx === index) {
        return { ...sub, isCompleted: !sub.isCompleted };
      }
      return sub;
    });

    this.kanbanService.updateTask(this.task().taskId, {
      subtasks: updatedSubtasks
    }).then(() => {
      console.log('Subtask progress successfully saved in Firestore.');
    }).catch((err) => {
      console.error('Failed to update subtask progress:', err);
    });
  }

  protected onStatusChange(targetColumnId: string): void {
    const active = this.activeBoard();
    const currentTask = this.task();
    if (currentTask.columnId === targetColumnId) return;

    const targetColumn = active.columns.find((col) => col.columnId === targetColumnId);
    if (!targetColumn) return;

    // Fetch total sibling tasks in targeted column to append to bottom
    const targetTasksCount = this.kanbanService.tasks().filter((t) => t.columnId === targetColumnId).length;

    this.kanbanService.moveTask(
      currentTask.taskId,
      targetColumnId,
      targetColumn.name,
      targetTasksCount
    ).then(() => {
      console.log(`Task successfully moved to "${targetColumn.name}" column.`);
    }).catch((err) => {
      console.error('Failed to move task across columns:', err);
    });
  }
}
