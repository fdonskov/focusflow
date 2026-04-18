import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import type { LlmLanguage, SubtaskSuggestion } from "@/types/llm";

import { useCategorizeMutation, useDecomposeMutation } from "./hooks";

interface LlmTaskActionsProps {
  title: string;
  description: string | null;
  onApplyCategory: (category: string) => void;
  onApplySubtasks: (description: string) => void;
}

export function LlmTaskActions({
  title,
  description,
  onApplyCategory,
  onApplySubtasks,
}: LlmTaskActionsProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? "ru") as LlmLanguage;

  const categorize = useCategorizeMutation();
  const decompose = useDecomposeMutation();

  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null);
  const [subtaskSuggestions, setSubtaskSuggestions] = useState<SubtaskSuggestion[] | null>(
    null,
  );

  const canRun = title.trim().length > 0;

  const runCategorize = async () => {
    if (!canRun) {
      toast.error(t("llm.summaryNeedTitle"));
      return;
    }
    try {
      const resp = await categorize.mutateAsync({ title, description, language });
      setCategorySuggestion(resp.category);
    } catch (err) {
      toast.error(t("toast.error"), { description: getErrorMessage(err) });
    }
  };

  const runDecompose = async () => {
    if (!canRun) {
      toast.error(t("llm.summaryNeedTitle"));
      return;
    }
    try {
      const resp = await decompose.mutateAsync({ title, description, language });
      setSubtaskSuggestions(resp.subtasks);
    } catch (err) {
      toast.error(t("toast.error"), { description: getErrorMessage(err) });
    }
  };

  const applySubtasksAsDescription = () => {
    if (!subtaskSuggestions) return;
    const formatted = subtaskSuggestions
      .map((s, i) => `${i + 1}. ${s.title}${s.description ? ` — ${s.description}` : ""}`)
      .join("\n");
    const merged = description ? `${description}\n\n${formatted}` : formatted;
    onApplySubtasks(merged);
    setSubtaskSuggestions(null);
  };

  const anyLoading = categorize.isPending || decompose.isPending;

  return (
    <div className="space-y-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {t("llm.suggest")}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runCategorize}
          disabled={anyLoading}
        >
          {categorize.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {t("llm.categorize")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runDecompose}
          disabled={anyLoading}
        >
          {decompose.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {t("llm.decompose")}
        </Button>
      </div>

      {categorySuggestion && (
        <div className="flex items-center justify-between gap-2 rounded border bg-background p-2">
          <span className="text-sm">
            {t("llm.categoryProposed", { category: categorySuggestion })}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => {
                onApplyCategory(categorySuggestion);
                setCategorySuggestion(null);
              }}
            >
              <Check className="h-3.5 w-3.5" />
              {t("llm.apply")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCategorySuggestion(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {subtaskSuggestions && subtaskSuggestions.length > 0 && (
        <div className="space-y-2 rounded border bg-background p-2">
          <div className="text-xs font-semibold">{t("llm.subtasksTitle")}</div>
          <p className="text-xs text-muted-foreground">{t("llm.subtasksHint")}</p>
          <ul className="space-y-1 text-sm">
            {subtaskSuggestions.map((s, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-2">
                <div className="font-medium">{s.title}</div>
                {s.description && (
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSubtaskSuggestions(null)}
            >
              <X className="h-3.5 w-3.5" />
              {t("llm.reject")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={applySubtasksAsDescription}
            >
              <Check className="h-3.5 w-3.5" />
              {t("llm.subtasksApply")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
