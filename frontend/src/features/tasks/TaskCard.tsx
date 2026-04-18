import { useTranslation } from "react-i18next";
import { Calendar, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import type { Task } from "@/types/task";

import { PriorityBadge, StatusBadge } from "./TaskBadge";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCategoryClick?: (category: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onCategoryClick }: TaskCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex-1 min-w-0">
          <CardTitle className="truncate">{task.title}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.category && (
              <button
                type="button"
                onClick={() => onCategoryClick?.(task.category!)}
                className="rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${t("filters.title")}: #${task.category}`}
              >
                #{task.category}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            aria-label={t("actions.edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task)}
            aria-label={t("actions.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        )}
        {task.due_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {t("task.dueDate")}: {formatDate(task.due_date)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
