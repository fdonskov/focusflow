import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api";
import type { LlmLanguage } from "@/types/llm";

import { useWorkloadSummary } from "./hooks";

export function WorkloadSummary() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? "ru") as LlmLanguage;
  const [enabled, setEnabled] = useState(false);

  const { data, isFetching, isError, error, refetch } = useWorkloadSummary(
    language,
    enabled,
  );

  const onGenerate = () => {
    if (enabled) {
      refetch();
    } else {
      setEnabled(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t("llm.summaryTitle")}
        </CardTitle>
        <Button
          size="sm"
          variant={enabled ? "outline" : "default"}
          onClick={onGenerate}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : enabled ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t("llm.summaryGenerate")}
        </Button>
      </CardHeader>
      <CardContent>
        {!enabled && (
          <p className="text-sm text-muted-foreground">{t("llm.summaryHint")}</p>
        )}
        {isFetching && (
          <p className="text-sm text-muted-foreground">{t("llm.summaryLoading")}</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        )}
        {data && !isFetching && (
          <div className="space-y-2">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{t("list.totalCount", { count: data.task_count })}</span>
              {data.overdue_count > 0 && (
                <span className="text-destructive">
                  Overdue: {data.overdue_count}
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
              {data.summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
