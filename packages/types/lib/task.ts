export type TaskStatus = 'inbox' | 'todo' | 'in-progress' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  url?: string;
  selectedText?: string;
  // Which workflow (and which of its steps) this task belongs to — the
  // shared step-identity contract other WEFT clients resolve "current step"
  // text through. Unset for tasks not created from/attached to a workflow.
  workflowId?: string;
  stepId?: string;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  createdAt: number;
  dueDate?: number;
  completedAt?: number;
  focusTimeMinutes?: number;
  estimatedMinutes?: number;
  lastModified: number;
  syncedToMobile: boolean;
  syncedAt?: number;
}

export interface TaskQueryOptions {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  tags?: string[];
  dueAfter?: number;
  dueBefore?: number;
  limit?: number;
  offset?: number;
}

export type TaskUpdatePayload = Partial<Omit<Task, 'id' | 'createdAt'>>;
