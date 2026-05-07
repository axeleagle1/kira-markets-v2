"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, ExecuteTradeResponse, TradeAction } from "@/types";

interface TradeInput {
  marketId: string;
  side: "YES" | "NO";
  shares: number;
  action: TradeAction;
}

async function executeTrade(input: TradeInput): Promise<ExecuteTradeResponse> {
  const res = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json: ApiResponse<ExecuteTradeResponse> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useExecuteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executeTrade,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["market", vars.marketId] });
      qc.invalidateQueries({ queryKey: ["markets"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["quote"] });
    },
  });
}
