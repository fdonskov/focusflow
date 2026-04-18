import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

const ALL = "__all__";

export interface TaskFiltersState {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  category?: string;
}

interface Props {
  value: TaskFiltersState;
  onChange: (next: TaskFiltersState) => void;
}

export function TaskFiltersBar({ value, onChange }: Props) {
  const { t } = useTranslation();

  const update = (patch: Partial<TaskFiltersState>) => onChange({ ...value, ...patch });
  const clear = () => onChange({});
  const hasFilters =
    Boolean(value.status) ||
    Boolean(value.priority) ||
    Boolean(value.search) ||
    Boolean(value.category);

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("filters.searchPlaceholder")}
            value={value.search ?? ""}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={value.status ?? ALL}
          onValueChange={(v) =>
            update({ status: v === ALL ? undefined : (v as TaskStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allStatuses")}</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={value.priority ?? ALL}
          onValueChange={(v) =>
            update({ priority: v === ALL ? undefined : (v as TaskPriority) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.allPriorities")}</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`priority.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.category && (
        <div className="inline-flex items-center gap-1 self-center rounded-full border bg-primary/10 px-3 py-1 text-sm text-primary">
          <span>#{value.category}</span>
          <button
            type="button"
            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
            onClick={() => update({ category: undefined })}
            aria-label={t("filters.clear")}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clear}>
          <X className="h-4 w-4" />
          {t("filters.clear")}
        </Button>
      )}
    </div>
  );
}
