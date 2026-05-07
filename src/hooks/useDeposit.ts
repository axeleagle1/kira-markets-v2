"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";

interface DepositResponse {
  newBalance: number;
  deposited: number;
}

async function deposit(): Promise<DepositResponse> {
  const res = await fetch("/api/deposit", {
    method: "POST",
  });
  const json: ApiResponse<DepositResponse> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deposit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
