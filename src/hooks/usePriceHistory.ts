"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";

export interface PricePoint {
  yesPrice: number;
  noPrice: number;
  volume: number;
  timestamp: string;
}

async function fetchPriceHistory(marketId: string, limit = 200): Promise<PricePoint[]> {
  const res = await fetch(`/api/markets/${marketId}/price-history?limit=${limit}`);
  const json: ApiResponse<PricePoint[]> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function usePriceHistory(marketId: string, limit = 200) {
  return useQuery({
    queryKey: ["priceHistory", marketId, limit],
    queryFn: () => fetchPriceHistory(marketId, limit),
    staleTime: 30_000,
    enabled: !!marketId,
  });
}
