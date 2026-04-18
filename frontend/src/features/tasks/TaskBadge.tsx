import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority, TaskStatus } from "@/types/task";

const statusVariant: Record<TaskStatus, "info" | "warning" | "success"> = {
  pending: "warning",
  in_progress: "info",
  done: "success",
};

const priorityVariant: Record<TaskPriority, "secondary" | "info" | "destructive"> = {
  low: "secondary",
  medium: "info",
  high: "destructive",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  return <Badge variant={statusVariant[status]}>{t(`status.${status}`)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation();
  return <Badge variant={priorityVariant[priority]}>{t(`priority.${priority}`)}</Badge>;
}
