import { Component, signal, input, output, viewChild, ElementRef, AfterViewInit, HostListener, effect } from '@angular/core';
import { Board, Subtask, Task } from '../../../core/models/kanban.model';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.scss'
})
export class EditTask implements AfterViewInit {
  // Query reference to primary input for focusing
  private readonly taskTitleInput = viewChild<ElementRef<HTMLInputElement>>('taskTitleInputRef');

  // --- Inputs ---
  public readonly task = input.required<Task>();
  public readonly activeBoard = input.required<Board>();

  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });
  public readonly onSubmit = output<{
    title: string;
    description: string;
    subtasks: Subtask[];
    columnId: string;
    status: string;
  }>({ alias: 'submit' });

  // --- Dynamic Form Signals (Signals-First) ---
  protected readonly title = signal<string>('');
  protected readonly description = signal<string>('');
  protected readonly subtasks = signal<Subtask[]>([]);
  protected readonly selectedColumnId = signal<string>('');
  protected readonly showErrors = signal<boolean>(false);

  constructor() {
    // Reactively copy existing task details to form signals on component initialization
    effect(() => {
      const activeTask = this.task();
      this.title.set(activeTask.title);
      this.description.set(activeTask.description || '');
      this.subtasks.set(activeTask.subtasks.map((sub) => ({ ...sub })));
      this.selectedColumnId.set(activeTask.columnId);
    });
  }

  // --- Input Handlers ---
  protected onTitleInput(value: string): void {
    this.title.set(value);
  }

  protected onDescriptionInput(value: string): void {
    this.description.set(value);
  }

  protected updateSubtaskTitle(index: number, value: string): void {
    this.subtasks.update((tasks) => {
      const copy = [...tasks];
      copy[index] = { ...copy[index], title: value };
      return copy;
    });
  }

  protected onColumnSelect(columnId: string): void {
    this.selectedColumnId.set(columnId);
  }

  // --- Dynamic Subtasks List Modifiers ---
  protected addSubtask(): void {
    this.subtasks.update((tasks) => [...tasks, { title: '', isCompleted: false }]);
  }

  protected removeSubtask(index: number): void {
    this.subtasks.update((tasks) => tasks.filter((_, idx) => idx !== index));
  }

  // --- Modal Close/Submit Triggers ---
  protected triggerClose(): void {
    this.onClose.emit();
  }

  protected triggerSubmit(): void {
    const isTitleEmpty = this.title().trim() === '';

    if (isTitleEmpty) {
      this.showErrors.set(true);
      return;
    }

    const currentBoard = this.activeBoard();
    const colId = this.selectedColumnId();
    const colMatch = currentBoard.columns.find((col) => col.columnId === colId);
    const colName = colMatch ? colMatch.name : '';

    // Discard subtasks with empty titles
    const filteredSubtasks = this.subtasks()
      .filter((sub) => sub.title.trim() !== '')
      .map((sub) => ({
        title: sub.title.trim(),
        isCompleted: sub.isCompleted
      }));

    this.onSubmit.emit({
      title: this.title().trim(),
      description: this.description().trim(),
      subtasks: filteredSubtasks,
      columnId: colId,
      status: colName
    });
  }

  // Allow closing the modal using the Escape key globally
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.triggerClose();
  }

  public ngAfterViewInit(): void {
    // Focus first input automatically for clean standard keyboard operation
    const inputEl = this.taskTitleInput()?.nativeElement;
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 50);
    }
  }
}
