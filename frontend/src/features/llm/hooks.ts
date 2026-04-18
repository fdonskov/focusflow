import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  CategorizeRequest,
  CategorizeResponse,
  DecomposeRequest,
  DecomposeResponse,
  LlmLanguage,
  WorkloadSummaryResponse,
} from "@/types/llm";

import { llmApi } from "./api";

export function useCategorizeMutation() {
  return useMutation<CategorizeResponse, unknown, CategorizeRequest>({
    mutationFn: (req) => llmApi.categorize(req),
  });
}

export function useDecomposeMutation() {
  return useMutation<DecomposeResponse, unknown, DecomposeRequest>({
    mutationFn: (req) => llmApi.decompose(req),
  });
}

export function useWorkloadSummary(
  language: LlmLanguage,
  enabled: boolean,
) {
  return useQuery<WorkloadSummaryResponse>({
    queryKey: ["llm", "summary", language],
    queryFn: () => llmApi.workloadSummary(language),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}
