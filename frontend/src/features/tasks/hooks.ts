import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  Task,
  TaskCreateInput,
  TaskListParams,
  TaskListResponse,
  TaskUpdateInput,
} from "@/types/task";

import { tasksApi } from "./api";

export const tasksKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

export function useTasks(params: TaskListParams) {
  return useQuery<TaskListResponse>({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation<Task, unknown, TaskCreateInput>({
    mutationFn: (input) => tasksApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation<Task, unknown, { id: string; input: TaskUpdateInput }>({
    mutationFn: ({ id, input }) => tasksApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
  });
}
