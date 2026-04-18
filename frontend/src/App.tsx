import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";

import { useHealth } from "@/features/app/useHealth";
import { LanguageSwitcher } from "@/features/i18n/LanguageSwitcher";
import { WorkloadSummary } from "@/features/llm/WorkloadSummary";
import { TaskList } from "@/features/tasks/TaskList";

export default function App() {
  const { t } = useTranslation();
  const { data: health } = useHealth();
  const llmEnabled = health?.llm_enabled ?? false;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl space-y-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("app.title")}</h1>
            <p className="text-muted-foreground">{t("app.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </header>

        {llmEnabled && <WorkloadSummary />}

        <main>
          <TaskList />
        </main>
      </div>
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}
