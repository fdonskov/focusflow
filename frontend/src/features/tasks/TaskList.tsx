import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { useDebounced } from "@/lib/useDebounced";
import { TaskFiltersBar, type TaskFiltersState } from "@/features/filters/TaskFilters";
import type { Task, TaskListParams } from "@/types/task";

import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { useTasks } from "./hooks";

const PAGE_SIZE = 20;

export function TaskList() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<TaskFiltersState>({});
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const debouncedSearch = useDebounced(filters.search ?? "", 300);

  const params: TaskListParams = useMemo(
    () => ({
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      search: debouncedSearch || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [filters.status, filters.priority, filters.category, debouncedSearch, page],
  );

  const { data, isLoading, isError, error } = useTasks(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const onFiltersChange = (next: TaskFiltersState) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <TaskFiltersBar value={filters} onChange={onFiltersChange} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("list.totalCount", { count: data?.total ?? 0 })}
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("actions.createTask")}
        </Button>
      </div>

      {isLoading && (
        <p className="py-8 text-center text-muted-foreground">{t("list.loading")}</p>
      )}

      {isError && (
        <p className="py-8 text-center text-destructive">
          {getErrorMessage(error)}
        </p>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          {filters.status || filters.priority || debouncedSearch || filters.category
            ? t("list.emptyFiltered")
            : t("list.empty")}
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={openEdit}
              onDelete={setDeletingTask}
              onCategoryClick={(category) => {
                setFilters({ ...filters, category });
                setPage(1);
              }}
            />
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("list.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("list.page", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("list.next")}
          </Button>
        </div>
      )}

      <TaskForm open={formOpen} onOpenChange={setFormOpen} initial={editingTask} />
      <DeleteTaskDialog task={deletingTask} onClose={() => setDeletingTask(null)} />
    </div>
  );
}
