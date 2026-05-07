import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface SyncStatus {
  total: number;
  fromPolymarket: number;
  active: number;
  localOnly: number;
}

interface SyncResult {
  message: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Hook to get sync status
 */
export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ["sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sync");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to trigger market sync
 */
export function useSyncMarkets() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, { limit?: number }>({
    mutationFn: async ({ limit = 100 }) => {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate markets and sync status queries
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });
}
