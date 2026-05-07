"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";

export interface ActivityItem {
  id: string;
  userId: string;
  marketId: string | null;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

async function fetchActivity(limit = 20): Promise<ActivityItem[]> {
  const res = await fetch(`/api/activity?limit=${limit}`);
  const json: ApiResponse<ActivityItem[]> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: () => fetchActivity(limit),
    staleTime: 30_000,
  });
}
