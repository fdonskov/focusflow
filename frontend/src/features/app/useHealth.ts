import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface Health {
  status: string;
  llm_enabled: boolean;
}

export function useHealth() {
  return useQuery<Health>({
    queryKey: ["health"],
    queryFn: async () => (await api.get<Health>("/health")).data,
    staleTime: 60_000,
  });
}
