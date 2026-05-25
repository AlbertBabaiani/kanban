export interface BoardColumn {
  columnId: string;
  name: string;
  color: string;
}

export interface Board {
  boardId: string;
  userId: string;
  name: string;
  columns: BoardColumn[];
  createdAt?: any;
}

export interface Subtask {
  title: string;
  isCompleted: boolean;
}

export interface Task {
  taskId: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  status: string; // Keep status aligned with column name
  order: number;
  subtasks: Subtask[];
}
