import { Component, signal, output, viewChild, ElementRef, AfterViewInit, input, effect } from '@angular/core';
import { Board, Subtask } from '../../../core/models/kanban.model';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss'
})
export class AddTask implements AfterViewInit {
  // Query reference to primary input for focusing
  private readonly taskTitleInput = viewChild<ElementRef<HTMLInputElement>>('taskTitleInputRef');

  // --- Inputs ---
  public readonly activeBoard = input.required<Board>();
  public readonly defaultColumnId = input<string | null>(null);

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
  protected readonly subtasks = signal<Subtask[]>([
    { title: '', isCompleted: false },
    { title: '', isCompleted: false }
  ]);
  protected readonly selectedColumnId = signal<string>('');
  protected readonly showErrors = signal<boolean>(false);

  constructor() {
    // Reactively preselect the correct column based on input context
    effect(() => {
      const defCol = this.defaultColumnId();
      if (defCol) {
        this.selectedColumnId.set(defCol);
      } else {
        const cols = this.activeBoard().columns;
        if (cols.length > 0 && !this.selectedColumnId()) {
          this.selectedColumnId.set(cols[0].columnId);
        }
      }
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
    // Optional description, but subtask placeholders cannot be empty if specified
    const hasEmptySubtask = this.subtasks().some((sub) => sub.title.trim() === '');

    if (isTitleEmpty || hasEmptySubtask) {
      this.showErrors.set(true);
      return;
    }

    const currentBoard = this.activeBoard();
    const colId = this.selectedColumnId();
    const colMatch = currentBoard.columns.find((col) => col.columnId === colId);
    const colName = colMatch ? colMatch.name : '';

    this.onSubmit.emit({
      title: this.title().trim(),
      description: this.description().trim(),
      subtasks: this.subtasks().map((sub) => ({
        title: sub.title.trim(),
        isCompleted: false
      })),
      columnId: colId,
      status: colName
    });
  }

  public ngAfterViewInit(): void {
    // Focus first input automatically for clean standard keyboard operation
    const inputEl = this.taskTitleInput()?.nativeElement;
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 50);
    }
  }
}
