import { Component, signal, input, output, viewChild, ElementRef, AfterViewInit, HostListener, effect } from '@angular/core';
import { Board, BoardColumn } from '../../../core/models/kanban.model';

@Component({
  selector: 'app-edit-board',
  standalone: true,
  imports: [],
  templateUrl: './edit-board.html',
  styleUrl: './edit-board.scss'
})
export class EditBoard implements AfterViewInit {
  // Query reference to the input element for programmatic keyboard focus
  private readonly boardNameInput = viewChild<ElementRef<HTMLInputElement>>('boardNameInputRef');

  // --- Inputs ---
  public readonly activeBoard = input.required<Board>();

  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });
  public readonly onSubmit = output<{ name: string; columns: BoardColumn[] }>({ alias: 'submit' });

  // --- Dynamic Form Signals (Signals-First) ---
  protected readonly boardName = signal<string>('');
  protected readonly columns = signal<BoardColumn[]>([]);
  protected readonly showErrors = signal<boolean>(false);

  constructor() {
    // Reactively copy active board's name and columns list into copyable signals on init
    effect(() => {
      const board = this.activeBoard();
      this.boardName.set(board.name);
      this.columns.set(board.columns.map(col => ({ ...col })));
    });
  }

  // --- Input Handlers ---
  protected onNameInput(name: string): void {
    this.boardName.set(name);
  }

  protected updateColumnName(index: number, name: string): void {
    this.columns.update((cols) => {
      const copy = [...cols];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  }

  protected updateColumnColor(index: number, color: string): void {
    this.columns.update((cols) => {
      const copy = [...cols];
      copy[index] = { ...copy[index], color };
      return copy;
    });
  }

  // --- Dynamic Columns Array Modifiers ---
  protected addColumn(): void {
    const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#F4D03F', '#E74C3C', '#9B59B6'];
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    
    this.columns.update((cols) => [
      ...cols, 
      { columnId: crypto.randomUUID(), name: '', color: randomColor }
    ]);
  }

  protected removeColumn(index: number): void {
    this.columns.update((cols) => cols.filter((_, idx) => idx !== index));
  }

  // --- Triggers ---
  protected triggerClose(): void {
    this.onClose.emit();
  }

  protected triggerSubmit(): void {
    const isNameEmpty = this.boardName().trim() === '';
    const hasEmptyColName = this.columns().some((col) => col.name.trim() === '');

    if (isNameEmpty || hasEmptyColName) {
      this.showErrors.set(true);
      return;
    }

    this.onSubmit.emit({
      name: this.boardName().trim(),
      columns: this.columns().map((col) => ({
        columnId: col.columnId,
        name: col.name.trim(),
        color: col.color
      }))
    });
  }

  // Allow closing the modal using the Escape key globally
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.triggerClose();
  }

  public ngAfterViewInit(): void {
    // Direct keyboard focus to input element dynamically
    const inputEl = this.boardNameInput()?.nativeElement;
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 50); // Small timeout ensures elements are fully painted in the DOM
    }
  }
}
