import { Component, signal, computed, effect, inject, OnInit } from '@angular/core';
import { KanbanService } from '../../core/services/kanban-service';
import { AuthService } from '../../core/services/auth-service';
import { Board, BoardColumn, Subtask, Task } from '../../core/models/kanban.model';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { AddBoard } from '../boards/add-board/add-board';
import { BoardColumns } from '../boards/board-columns/board-columns';
import { DeleteBoard } from '../boards/delete-board/delete-board';
import { EditBoard } from '../boards/edit-board/edit-board';
import { AddTask } from '../tasks/add-task/add-task';
import { TaskDetails } from '../tasks/task-details/task-details';
import { DeleteTask } from '../tasks/delete-task/delete-task';
import { EditTask } from '../tasks/edit-task/edit-task';
import { ErrorModal } from '../error-modal/error-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Sidebar, Header, AddBoard, BoardColumns, DeleteBoard, EditBoard, AddTask, TaskDetails, DeleteTask, EditTask, ErrorModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  protected readonly kanbanService = inject(KanbanService);
  protected readonly authService = inject(AuthService);

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
  protected readonly isDeleteTaskOpen = signal<boolean>(false);
  protected readonly isEditTaskOpen = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

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
  }

  public ngOnInit(): void {
    // Initialize boards real-time sync with current authenticated user UID
    const profile = this.authService.currentUser();
    if (profile) {
      this.kanbanService.subscribeToBoards(profile.uid);
    }
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
        this.errorMessage.set(err.message || 'Failed to create board.');
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
      this.errorMessage.set(err.message || 'Failed to create task.');
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
    this.isDeleteTaskOpen.set(true);
  }

  protected closeDeleteTaskModal(): void {
    this.isDeleteTaskOpen.set(false);
  }

  protected onTaskDeleteConfirm(): void {
    const task = this.activeTask();
    if (!task) return;

    this.kanbanService.deleteTask(task.taskId)
      .then(() => {
        this.closeDeleteTaskModal();
        this.closeTaskDetailsModal();
        console.log('Task successfully deleted.');
      })
      .catch((err) => {
        console.error('Failed to delete task:', err);
        this.errorMessage.set(err.message || 'Failed to delete task.');
      });
  }

  protected onTaskEdit(task: Task): void {
    this.selectedTask.set(task);
    this.isEditTaskOpen.set(true);
  }

  protected closeEditTaskModal(): void {
    this.isEditTaskOpen.set(false);
  }

  protected onTaskEditSubmit(event: {
    title: string;
    description: string;
    subtasks: Subtask[];
    columnId: string;
    status: string;
  }): void {
    const task = this.activeTask();
    if (!task) return;

    const isColumnChanged = task.columnId !== event.columnId;
    const taskUpdates = {
      title: event.title,
      description: event.description,
      subtasks: event.subtasks
    };

    if (isColumnChanged) {
      const targetTasksCount = this.kanbanService.tasks().filter((t) => t.columnId === event.columnId).length;

      this.kanbanService.moveTask(task.taskId, event.columnId, event.status, targetTasksCount)
        .then(() => {
          return this.kanbanService.updateTask(task.taskId, taskUpdates);
        })
        .then(() => {
          this.closeEditTaskModal();
          this.closeTaskDetailsModal();
          console.log('Task details and status successfully edited.');
        })
        .catch(err => {
          console.error('Failed to move task during edit:', err);
          this.errorMessage.set(err.message || 'Failed to edit task.');
        });
    } else {
      this.kanbanService.updateTask(task.taskId, taskUpdates)
        .then(() => {
          this.closeEditTaskModal();
          this.closeTaskDetailsModal();
          console.log('Task details successfully edited.');
        })
        .catch(err => {
          console.error('Failed to update task:', err);
          this.errorMessage.set(err.message || 'Failed to edit task.');
        });
    }
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
      this.errorMessage.set(err.message || 'Failed to update board.');
    });
  }

  protected onAddTaskClick(event: { columnId: string; status: string }): void {
    this.openAddTaskModal(event.columnId);
  }

  protected onTaskMove(event: {
    taskId: string;
    targetColumnId: string;
    targetStatus: string;
    newOrder: number;
  }): void {
    this.kanbanService.moveTask(event.taskId, event.targetColumnId, event.targetStatus, event.newOrder)
      .then(() => {
        console.log('Task successfully transitioned via Drag and Drop.');
      })
      .catch((err) => {
        console.error('Failed to move task:', err);
        this.errorMessage.set(err.message || 'Failed to move task.');
      });
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
        this.errorMessage.set(err.message || 'Failed to delete board.');
      });
  }

  protected onLogout(): void {
    this.authService.logout().catch(err => {
      this.errorMessage.set(err.message || 'Failed to log out.');
    });
  }

  protected clearError(): void {
    this.errorMessage.set(null);
  }
}
