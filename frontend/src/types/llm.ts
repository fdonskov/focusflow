export type LlmLanguage = "ru" | "en";

export interface CategorizeRequest {
  title: string;
  description?: string | null;
  language: LlmLanguage;
}

export interface CategorizeResponse {
  category: string;
}

export interface DecomposeRequest {
  title: string;
  description?: string | null;
  language: LlmLanguage;
}

export interface SubtaskSuggestion {
  title: string;
  description: string | null;
}

export interface DecomposeResponse {
  subtasks: SubtaskSuggestion[];
}

export interface WorkloadSummaryResponse {
  summary: string;
  task_count: number;
  overdue_count: number;
}
