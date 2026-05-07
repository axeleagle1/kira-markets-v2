"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, MarketData } from "@/types";

async function fetchMarket(id: string): Promise<MarketData> {
  const res = await fetch(`/api/markets/${id}`);
  const json: ApiResponse<MarketData> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: () => fetchMarket(id),
    staleTime: 10_000,
    enabled: !!id,
  });
}
