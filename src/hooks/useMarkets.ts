"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { ApiResponse, PaginatedResponse, MarketListItem } from "@/types";

export interface MarketsParams {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  pageSize?: number;
}

async function fetchMarkets(params: MarketsParams & { page: number }): Promise<PaginatedResponse<MarketListItem>> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);
  if (params.sort) sp.set("sort", params.sort);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize ?? 30));

  const res = await fetch(`/api/markets?${sp}`);
  const json: ApiResponse<PaginatedResponse<MarketListItem>> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useMarkets(params: MarketsParams = {}) {
  return useInfiniteQuery({
    queryKey: ["markets", params],
    queryFn: ({ pageParam }) => fetchMarkets({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 15_000,
  });
}
