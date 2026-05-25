import { Injectable, effect, signal } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  getDocs,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { FirebaseService } from './firebase-service';
import { Board, BoardColumn, Task, Subtask } from '../models/kanban.model';

@Injectable({
  providedIn: 'root',
})
export class KanbanService {
  private readonly db: Firestore;

  // --- Reactive Signals State Management ---
  public readonly boards = signal<Board[]>([]);
  public readonly activeBoard = signal<Board | null>(null);
  public readonly tasks = signal<Task[]>([]);

  // --- Real-time Subscription Cleanups ---
  private boardsUnsubscribe: (() => void) | null = null;
  private tasksUnsubscribe: (() => void) | null = null;

  // Track the active user UID to prevent cross-account sync leaks
  private currentUserId: string | null = null;

  constructor(private firebaseService: FirebaseService) {
    this.db = this.firebaseService.firestore;

    // --- Core Reactive Flow ---
    // Automatically manage task subscriptions whenever the active board selection changes
    effect(() => {
      const active = this.activeBoard();

      // Unsubscribe from previous tasks
      if (this.tasksUnsubscribe) {
        this.tasksUnsubscribe();
        this.tasksUnsubscribe = null;
      }

      if (active) {
        this.subscribeToTasks(active.boardId);
      } else {
        this.tasks.set([]);
      }
    });
  }

  // ==========================================================================
  // REAL-TIME SUBSCRIBERS
  // ==========================================================================

  /**
   * Subscribes to all boards associated with the logged-in User UID.
   */
  public subscribeToBoards(userId: string): void {
    if (this.currentUserId === userId && this.boardsUnsubscribe) return;

    this.unsubscribeAll();
    this.currentUserId = userId;

    const q = query(collection(this.db, 'boards'), where('userId', '==', userId));

    this.boardsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const boardsList = snapshot.docs.map(
          (docSnap) =>
            ({
              boardId: docSnap.id,
              ...docSnap.data(),
            }) as Board,
        );

        this.boards.set(boardsList);

        // Keep active board sync'd or set the default first board
        const active = this.activeBoard();
        if (boardsList.length > 0) {
          const match = boardsList.find((b) => b.boardId === active?.boardId);
          if (match) {
            this.activeBoard.set(match);
          } else {
            this.activeBoard.set(boardsList[0]);
          }
        } else {
          this.activeBoard.set(null);
        }
      },
      (error) => {
        console.error('Firestore Boards subscription failed:', error);
      },
    );
  }

  /**
   * Subscribes to tasks under a specific active Board.
   * Auto-managed by the effect tracking activeBoard().
   */
  private subscribeToTasks(boardId: string): void {
    const q = query(collection(this.db, 'tasks'), where('boardId', '==', boardId));

    this.tasksUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksList = snapshot.docs.map(
          (docSnap) =>
            ({
              taskId: docSnap.id,
              ...docSnap.data(),
            }) as Task,
        );

        // Sort items by position order
        tasksList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.tasks.set(tasksList);
      },
      (error) => {
        console.error('Firestore Tasks subscription failed:', error);
      },
    );
  }

  /**
   * Resets signals and unsubscribes all active Firestore queries to prevent leaks.
   */
  public unsubscribeAll(): void {
    if (this.boardsUnsubscribe) {
      this.boardsUnsubscribe();
      this.boardsUnsubscribe = null;
    }
    if (this.tasksUnsubscribe) {
      this.tasksUnsubscribe();
      this.tasksUnsubscribe = null;
    }
    this.boards.set([]);
    this.activeBoard.set(null);
    this.tasks.set([]);
    this.currentUserId = null;
  }

  // ==========================================================================
  // BOARDS CRUD
  // ==========================================================================

  /**
   * Creates a new Kanban board with unique column IDs.
   */
  public async createBoard(
    name: string,
    columns: { name: string; color: string }[],
  ): Promise<string> {
    if (!this.currentUserId) throw new Error('Cannot create board: User not authenticated.');

    const newColumns: BoardColumn[] = columns.map((col) => ({
      columnId: crypto.randomUUID(),
      name: col.name,
      color: col.color,
    }));

    const docRef = await addDoc(collection(this.db, 'boards'), {
      userId: this.currentUserId,
      name,
      columns: newColumns,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Updates board metadata or edits board columns.
   */
  public async updateBoard(
    boardId: string,
    updates: Partial<Omit<Board, 'boardId' | 'userId'>>,
  ): Promise<void> {
    const boardRef = doc(this.db, 'boards', boardId);
    await updateDoc(boardRef, updates);
  }

  /**
   * Deletes a board and cleans up all associated tasks inside a transaction batch.
   */
  public async deleteBoard(boardId: string): Promise<void> {
    const batch = writeBatch(this.db);

    // Delete board document
    const boardRef = doc(this.db, 'boards', boardId);
    batch.delete(boardRef);

    // Fetch and queue deletion of all tasks under the board
    const q = query(collection(this.db, 'tasks'), where('boardId', '==', boardId));
    const taskSnaps = await getDocs(q);
    taskSnaps.docs.forEach((taskDoc) => {
      batch.delete(taskDoc.ref);
    });

    // Commit batch transaction
    await batch.commit();

    // Reset active board to first available board
    const currentBoards = this.boards().filter((b) => b.boardId !== boardId);
    if (currentBoards.length > 0) {
      this.activeBoard.set(currentBoards[0]);
    } else {
      this.activeBoard.set(null);
    }
  }

  // ==========================================================================
  // TASKS CRUD
  // ==========================================================================

  /**
   * Appends a new task card to a targeted column with order indexing.
   */
  public async createTask(
    boardId: string,
    columnId: string,
    status: string,
    title: string,
    description: string,
    subtasks: Subtask[],
  ): Promise<string> {
    // Calculate the order value (append to bottom)
    const existingCount = this.tasks().filter((t) => t.columnId === columnId).length;

    const docRef = await addDoc(collection(this.db, 'tasks'), {
      boardId,
      columnId,
      status,
      title,
      description,
      order: existingCount,
      subtasks,
    });

    return docRef.id;
  }

  /**
   * Updates task details, title, description, or subtask completion checkmarks.
   */
  public async updateTask(
    taskId: string,
    updates: Partial<Omit<Task, 'taskId' | 'boardId'>>,
  ): Promise<void> {
    const taskRef = doc(this.db, 'tasks', taskId);
    await updateDoc(taskRef, updates);
  }

  /**
   * Removes a specific task card.
   */
  public async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(this.db, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  /**
   * Handles moving task cards across columns and updates layout ordering.
   * Utilizes batch updates to commit atomicity.
   */
  public async moveTask(
    taskId: string,
    targetColumnId: string,
    targetStatus: string,
    newOrder: number,
  ): Promise<void> {
    const batch = writeBatch(this.db);
    const currentTasks = [...this.tasks()];
    const taskIndex = currentTasks.findIndex((t) => t.taskId === taskId);
    if (taskIndex === -1) return;

    const movedTask = { ...currentTasks[taskIndex] };
    const sourceColumnId = movedTask.columnId;
    const isSameColumn = sourceColumnId === targetColumnId;

    if (isSameColumn) {
      // Sort and filter sibling tasks
      const colTasks = currentTasks
        .filter((t) => t.columnId === sourceColumnId && t.taskId !== taskId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // Re-insert task
      colTasks.splice(newOrder, 0, movedTask);

      // Queue batch updates
      colTasks.forEach((task, index) => {
        const ref = doc(this.db, 'tasks', task.taskId);
        batch.update(ref, { order: index });
      });
    } else {
      // 1. Remove from source column and re-index siblings
      const sourceTasks = currentTasks
        .filter((t) => t.columnId === sourceColumnId && t.taskId !== taskId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      sourceTasks.forEach((task, index) => {
        const ref = doc(this.db, 'tasks', task.taskId);
        batch.update(ref, { order: index });
      });

      // 2. Insert into target column and update variables
      const targetTasks = currentTasks
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      movedTask.columnId = targetColumnId;
      movedTask.status = targetStatus;

      targetTasks.splice(newOrder, 0, movedTask);

      targetTasks.forEach((task, index) => {
        const ref = doc(this.db, 'tasks', task.taskId);
        batch.update(ref, {
          columnId: task.columnId,
          status: task.status,
          order: index,
        });
      });
    }

    await batch.commit();
  }
}
