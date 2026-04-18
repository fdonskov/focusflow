import { useTranslation } from "react-i18next";
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
import { getErrorMessage } from "@/lib/api";
import type { Task } from "@/types/task";

import { useDeleteTask } from "./hooks";

interface DeleteTaskDialogProps {
  task: Task | null;
  onClose: () => void;
}

export function DeleteTaskDialog({ task, onClose }: DeleteTaskDialogProps) {
  const { t } = useTranslation();
  const deleteMut = useDeleteTask();
  const open = Boolean(task);

  const onConfirm = async () => {
    if (!task) return;
    try {
      await deleteMut.mutateAsync(task.id);
      toast.success(t("toast.taskDeleted"));
      onClose();
    } catch (err) {
      toast.error(t("toast.error"), { description: getErrorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog.deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialog.deleteDescription", { title: task?.title ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMut.isPending}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteMut.isPending}
          >
            {t("actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
