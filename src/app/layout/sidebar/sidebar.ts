import { Component, input, output, computed } from '@angular/core';
import { Board } from '../../core/models/kanban.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  // --- Inputs (Signal-First) ---
  public readonly boards = input.required<Board[]>();
  public readonly activeBoard = input<Board | null>(null);
  public readonly theme = input.required<'light' | 'dark'>();

  // --- Outputs (Signal-First) ---
  public readonly onToggleSidebar = output<void>({ alias: 'toggleSidebar' });
  public readonly onToggleTheme = output<void>({ alias: 'toggleTheme' });
  public readonly onSelectBoard = output<Board>({ alias: 'selectBoard' });
  public readonly onCreateBoard = output<void>({ alias: 'createBoard' });

  // --- Computed Selectors ---
  protected readonly boardsCount = computed(() => this.boards().length);

  // --- Action Handlers ---
  protected triggerToggleSidebar(): void {
    this.onToggleSidebar.emit();
  }

  protected triggerToggleTheme(): void {
    this.onToggleTheme.emit();
  }

  protected triggerSelectBoard(board: Board): void {
    this.onSelectBoard.emit(board);
  }

  protected triggerCreateBoard(): void {
    this.onCreateBoard.emit();
  }
}
