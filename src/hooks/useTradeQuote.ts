"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, TradeQuoteResponse, TradeAction } from "@/types";

interface QuoteParams {
  marketId: string;
  side: "YES" | "NO";
  shares: number;
  action: TradeAction;
  enabled?: boolean;
}

async function fetchQuote(params: Omit<QuoteParams, "enabled">): Promise<TradeQuoteResponse> {
  const sp = new URLSearchParams({
    marketId: params.marketId,
    side: params.side,
    shares: String(params.shares),
    action: params.action,
  });

  const res = await fetch(`/api/trades/quote?${sp}`);
  const json: ApiResponse<TradeQuoteResponse> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useTradeQuote(params: QuoteParams) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: ["quote", queryParams.marketId, queryParams.side, queryParams.shares, queryParams.action],
    queryFn: () => fetchQuote(queryParams),
    enabled: enabled && queryParams.shares > 0 && !!queryParams.marketId,
    staleTime: 5_000,
    retry: false,
  });
}
