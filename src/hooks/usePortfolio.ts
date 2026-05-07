"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, PortfolioData } from "@/types";

async function fetchPortfolio(): Promise<PortfolioData> {
  const res = await fetch("/api/portfolio");
  const json: ApiResponse<PortfolioData> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio,
    staleTime: 10_000,
  });
}
