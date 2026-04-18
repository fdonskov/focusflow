import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHealth } from "@/features/app/useHealth";
import { LlmTaskActions } from "@/features/llm/LlmTaskActions";
import { getErrorMessage } from "@/lib/api";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

import { useCreateTask, useUpdateTask } from "./hooks";

const schema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().max(10_000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "done"]),
  due_date: z.string().optional(),
  category: z.string().max(64).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Task | null;
}

const defaultValues: FormValues = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  due_date: "",
  category: "",
};

export function TaskForm({ open, onOpenChange, initial }: TaskFormProps) {
  const { t } = useTranslation();
  const { data: health } = useHealth();
  const llmEnabled = health?.llm_enabled ?? false;
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const isEdit = Boolean(initial);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? {
              title: initial.title,
              description: initial.description ?? "",
              priority: initial.priority,
              status: initial.status,
              due_date: initial.due_date ?? "",
              category: initial.category ?? "",
            }
          : defaultValues,
      );
    }
  }, [open, initial, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      priority: values.priority,
      status: values.status,
      due_date: values.due_date || null,
      category: values.category?.trim() || null,
    };

    try {
      if (isEdit && initial) {
        await updateMut.mutateAsync({ id: initial.id, input: payload });
        toast.success(t("toast.taskUpdated"));
      } else {
        await createMut.mutateAsync(payload);
        toast.success(t("toast.taskCreated"));
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(t("toast.error"), { description: getErrorMessage(err) });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("task.title")} *</Label>
            <Input id="title" autoFocus {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {t("validation.titleRequired")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("task.description")}</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("task.priority")}</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("task.status")}</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">{t("task.dueDate")}</Label>
              <Input id="due_date" type="date" {...form.register("due_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t("task.category")}</Label>
              <Input id="category" {...form.register("category")} />
            </div>
          </div>

          {llmEnabled && (
            <LlmTaskActions
              title={form.watch("title")}
              description={form.watch("description") ?? null}
              onApplyCategory={(c) => form.setValue("category", c)}
              onApplySubtasks={(d) => form.setValue("description", d)}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
