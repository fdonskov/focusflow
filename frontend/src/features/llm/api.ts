import { api } from "@/lib/api";
import type {
  CategorizeRequest,
  CategorizeResponse,
  DecomposeRequest,
  DecomposeResponse,
  LlmLanguage,
  WorkloadSummaryResponse,
} from "@/types/llm";

export const llmApi = {
  async categorize(req: CategorizeRequest): Promise<CategorizeResponse> {
    const { data } = await api.post<CategorizeResponse>("/llm/categorize", req);
    return data;
  },

  async decompose(req: DecomposeRequest): Promise<DecomposeResponse> {
    const { data } = await api.post<DecomposeResponse>("/llm/decompose", req);
    return data;
  },

  async workloadSummary(language: LlmLanguage): Promise<WorkloadSummaryResponse> {
    const { data } = await api.get<WorkloadSummaryResponse>("/llm/workload-summary", {
      params: { language },
    });
    return data;
  },
};
