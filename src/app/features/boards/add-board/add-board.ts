import { Component, signal, output } from '@angular/core';

@Component({
  selector: 'app-add-board',
  standalone: true,
  imports: [],
  templateUrl: './add-board.html',
  styleUrl: './add-board.scss'
})
export class AddBoard {
  // --- Outputs ---
  public readonly onClose = output<void>({ alias: 'close' });
  public readonly onSubmit = output<{ name: string; columns: { name: string; color: string }[] }>({ alias: 'submit' });

  // --- Dynamic Form Signals (Signals-First) ---
  protected readonly boardName = signal<string>('');
  protected readonly columns = signal<{ name: string; color: string }[]>([
    { name: 'Todo', color: '#49C4E5' },
    { name: 'Doing', color: '#8471F2' }
  ]);
  
  // Validation toggle state
  protected readonly showErrors = signal<boolean>(false);

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
    
    this.columns.update((cols) => [...cols, { name: '', color: randomColor }]);
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
        name: col.name.trim(),
        color: col.color
      }))
    });
  }
}
