export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "done";

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
export const TASK_STATUSES: TaskStatus[] = ["pending", "in_progress", "done"];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  category?: string | null;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
  category?: string | null;
}

export type TaskSortField =
  | "created_at"
  | "updated_at"
  | "due_date"
  | "priority"
  | "title";
export type SortOrder = "asc" | "desc";

export interface TaskListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  search?: string;
  due_before?: string;
  due_after?: string;
  page?: number;
  page_size?: number;
  sort_by?: TaskSortField;
  sort_order?: SortOrder;
}
