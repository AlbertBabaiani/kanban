import { Component, signal, computed, effect, inject } from '@angular/core';
import { KanbanService } from './core/services/kanban-service';
import { Board } from './core/models/kanban.model';
import { Sidebar } from './layout/sidebar/sidebar';
import { Header } from './layout/header/header';
import { AddBoard } from './features/boards/add-board/add-board';
import { BoardColumns } from './features/boards/board-columns/board-columns';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Header, AddBoard, BoardColumns],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Inject core service
  protected readonly kanbanService = inject(KanbanService);

  // --- UI Reactive State (Signals) ---
  protected readonly isSidebarOpen = signal<boolean>(true);
  protected readonly theme = signal<'light' | 'dark'>('light');
  protected readonly isMobileMenuOpen = signal<boolean>(false);
  protected readonly isAddBoardOpen = signal<boolean>(false);

  // --- Computed Selectors ---
  protected readonly boards = computed(() => this.kanbanService.boards());
  protected readonly activeBoard = computed(() => this.kanbanService.activeBoard());
  protected readonly boardsCount = computed(() => this.boards().length);
  protected readonly tasks = computed(() => this.kanbanService.tasks());

  constructor() {
    // 1. Detect and apply theme preferences
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }

    // 2. Reactively synchronize theme switch to document attributes
    effect(() => {
      const activeTheme = this.theme();
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem('theme', activeTheme);
    });

    // 3. Initialize real-time board sync (Trigger with default demo-user-123 context)
    this.kanbanService.subscribeToBoards('demo-user-123');
  }

  // --- UI Action Handlers ---
  protected toggleSidebar(): void {
    this.isSidebarOpen.update(val => !val);
  }

  protected toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  protected selectBoard(board: Board): void {
    this.kanbanService.activeBoard.set(board);
    this.isMobileMenuOpen.set(false); // Close overlay on selection
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(val => !val);
  }

  // --- Board Creation Modal Handlers ---
  protected openAddBoardModal(): void {
    this.isAddBoardOpen.set(true);
    this.isMobileMenuOpen.set(false); // Close mobile selection menu
  }

  protected closeAddBoardModal(): void {
    this.isAddBoardOpen.set(false);
  }

  protected onBoardSubmit(event: { name: string; columns: { name: string; color: string }[] }): void {
    this.kanbanService.createBoard(event.name, event.columns)
      .then(id => {
        console.log('Board successfully created with ID:', id);
        this.isAddBoardOpen.set(false); // Close modal
      })
      .catch(err => {
        console.error('Failed to create board:', err);
      });
  }

  // --- Temporary Demo CRUD Helpers ---
  protected demoTaskCreate(): void {
    const active = this.activeBoard();
    if (!active || active.columns.length === 0) return;
    
    const taskTitle = prompt('Enter Task Title:');
    if (!taskTitle) return;

    this.kanbanService.createTask(
      active.boardId,
      active.columns[0].columnId,
      active.columns[0].name,
      taskTitle,
      'Demo Description',
      [{ title: 'Subtask 1', isCompleted: false }]
    ).then(id => {
      console.log('Task successfully created:', id);
    }).catch(err => {
      console.error('Failed to create task:', err);
    });
  }

  protected demoOptionsClick(): void {
    const active = this.activeBoard();
    if (!active) return;
    
    if (confirm(`Do you want to DELETE board "${active.name}"?`)) {
      this.kanbanService.deleteBoard(active.boardId)
        .then(() => console.log('Board deleted.'))
        .catch(err => console.error(err));
    }
  }
}
