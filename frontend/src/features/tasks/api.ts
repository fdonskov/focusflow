import { api } from "@/lib/api";
import type {
  Task,
  TaskCreateInput,
  TaskListParams,
  TaskListResponse,
  TaskUpdateInput,
} from "@/types/task";

export const tasksApi = {
  async list(params: TaskListParams = {}): Promise<TaskListResponse> {
    const cleaned: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        cleaned[k] = v as string | number;
      }
    }
    const { data } = await api.get<TaskListResponse>("/tasks", { params: cleaned });
    return data;
  },

  async get(id: string): Promise<Task> {
    const { data } = await api.get<Task>(`/tasks/${id}`);
    return data;
  },

  async create(input: TaskCreateInput): Promise<Task> {
    const { data } = await api.post<Task>("/tasks", input);
    return data;
  },

  async update(id: string, input: TaskUpdateInput): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
