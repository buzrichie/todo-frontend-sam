export interface Task {
  taskId: string;
  userId: string;
  description: string;
  status: 'Pending' | 'Completed' | 'Expired';
  deadline: number;
  expireAt: number;
  date?: string;
}

export interface CreateTaskRequest {
  description: string;
  date?: string;
}

export interface UpdateTaskRequest {
  description?: string;
  status?: string;
}
