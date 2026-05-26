import { Component, signal, computed, effect, inject } from '@angular/core';
import { KanbanService } from './core/services/kanban-service';
import { Board, BoardColumn, Subtask, Task } from './core/models/kanban.model';
import { Sidebar } from './layout/sidebar/sidebar';
import { Header } from './layout/header/header';
import { AddBoard } from './features/boards/add-board/add-board';
import { BoardColumns } from './features/boards/board-columns/board-columns';
import { DeleteBoard } from './features/boards/delete-board/delete-board';
import { EditBoard } from './features/boards/edit-board/edit-board';
import { AddTask } from './features/tasks/add-task/add-task';
import { TaskDetails } from './features/tasks/task-details/task-details';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Header, AddBoard, BoardColumns, DeleteBoard, EditBoard, AddTask, TaskDetails],
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
  protected readonly isDeleteBoardOpen = signal<boolean>(false);
  protected readonly isEditBoardOpen = signal<boolean>(false);
  protected readonly isAddTaskOpen = signal<boolean>(false);
  protected readonly addTaskPreselectedColumnId = signal<string | null>(null);
  protected readonly isTaskDetailsOpen = signal<boolean>(false);
  protected readonly selectedTask = signal<Task | null>(null);

  // --- Computed Selectors ---
  protected readonly boards = computed(() => this.kanbanService.boards());
  protected readonly activeBoard = computed(() => this.kanbanService.activeBoard());
  protected readonly boardsCount = computed(() => this.boards().length);
  protected readonly tasks = computed(() => this.kanbanService.tasks());

  // Dynamic selected task selector mapping to latest tasks array (ensures subtasks check/uncheck updates immediately on the details modal)
  protected readonly activeTask = computed(() => {
    const selected = this.selectedTask();
    if (!selected) return null;
    return this.tasks().find((t) => t.taskId === selected.taskId) || selected;
  });

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

  // --- Task Creation Modal Handlers ---
  protected openAddTaskModal(columnId: string | null = null): void {
    this.addTaskPreselectedColumnId.set(columnId);
    this.isAddTaskOpen.set(true);
  }

  protected closeAddTaskModal(): void {
    this.isAddTaskOpen.set(false);
    this.addTaskPreselectedColumnId.set(null);
  }

  protected onTaskSubmit(event: {
    title: string;
    description: string;
    subtasks: Subtask[];
    columnId: string;
    status: string;
  }): void {
    const active = this.activeBoard();
    if (!active) return;

    this.kanbanService.createTask(
      active.boardId,
      event.columnId,
      event.status,
      event.title,
      event.description,
      event.subtasks
    ).then(id => {
      console.log('Task successfully created with ID:', id);
      this.closeAddTaskModal();
    }).catch(err => {
      console.error('Failed to create task:', err);
    });
  }

  // --- Task Details Modal Handlers ---
  protected openTaskDetailsModal(task: Task): void {
    this.selectedTask.set(task);
    this.isTaskDetailsOpen.set(true);
  }

  protected closeTaskDetailsModal(): void {
    this.isTaskDetailsOpen.set(false);
    this.selectedTask.set(null);
  }

  protected onTaskDelete(taskId: string): void {
    this.kanbanService.deleteTask(taskId)
      .then(() => {
        this.closeTaskDetailsModal();
        console.log('Task successfully deleted.');
      })
      .catch((err) => {
        console.error('Failed to delete task:', err);
      });
  }

  protected onTaskEdit(task: Task): void {
    console.log('Task edit trigger requested for task:', task);
    // Placeholder edit action handler trigger
  }

  // --- Board Editing Modal Handlers ---
  protected openEditBoardModal(): void {
    this.isEditBoardOpen.set(true);
    this.isMobileMenuOpen.set(false); // Close mobile switcher menu
  }

  protected closeEditBoardModal(): void {
    this.isEditBoardOpen.set(false);
  }

  protected onBoardEditSubmit(event: { name: string; columns: BoardColumn[] }): void {
    const active = this.activeBoard();
    if (!active) return;

    this.kanbanService.updateBoard(active.boardId, {
      name: event.name,
      columns: event.columns
    }).then(() => {
      this.isEditBoardOpen.set(false); // Close modal
      console.log('Board successfully updated.');
    }).catch(err => {
      console.error('Failed to update board:', err);
    });
  }

  protected onAddTaskClick(event: { columnId: string; status: string }): void {
    this.openAddTaskModal(event.columnId);
  }

  // --- Board Deletion Modal Handlers ---
  protected openDeleteBoardModal(): void {
    this.isDeleteBoardOpen.set(true);
  }

  protected closeDeleteBoardModal(): void {
    this.isDeleteBoardOpen.set(false);
  }

  protected onBoardDeleteConfirm(): void {
    const active = this.activeBoard();
    if (!active) return;

    this.kanbanService.deleteBoard(active.boardId)
      .then(() => {
        this.isDeleteBoardOpen.set(false); // Close modal
        console.log('Board successfully deleted.');
      })
      .catch(err => {
        console.error('Failed to delete board:', err);
      });
  }
}
