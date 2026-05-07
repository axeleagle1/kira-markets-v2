"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/lib/ws";
import type { MarketListItem, MarketData, PaginatedResponse } from "@/types";

interface PriceUpdateEvent {
  type: "price_update";
  marketId: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  totalTrades: number;
}

/**
 * Subscribes to real-time price updates for a market via WebSocket.
 * Updates React Query cache for both the individual market and the markets list.
 */
export function useMarketPrice(marketId: string | undefined) {
  const queryClient = useQueryClient();
  const marketIdRef = useRef(marketId);

  useEffect(() => {
    marketIdRef.current = marketId;
  }, [marketId]);

  useEffect(() => {
    if (!marketId) return;

    // Connect and subscribe
    wsClient.connect();
    wsClient.subscribeMarket(marketId);

    const unsub = wsClient.on("price_update", (event) => {
      const data = event as unknown as PriceUpdateEvent;
      if (data.marketId !== marketIdRef.current) return;

      // Update individual market cache
      queryClient.setQueryData<MarketData>(
        ["market", data.marketId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            yesPrice: data.yesPrice,
            noPrice: data.noPrice,
            volume: data.volume,
            totalTrades: data.totalTrades,
          };
        }
      );

      // Update markets list cache (all pages)
      queryClient.setQueriesData<PaginatedResponse<MarketListItem>>(
        { queryKey: ["markets"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === data.marketId
                ? {
                    ...item,
                    yesPrice: data.yesPrice,
                    noPrice: data.noPrice,
                    volume: data.volume,
                    totalTrades: data.totalTrades,
                  }
                : item
            ),
          };
        }
      );
    });

    return () => {
      unsub();
      wsClient.unsubscribeMarket(marketId);
    };
  }, [marketId, queryClient]);
}

/**
 * Subscribes to price updates for all visible markets in the list.
 * Use on the markets page for live price feeds.
 */
export function useMarketsPriceUpdates(marketIds: string[]) {
  const queryClient = useQueryClient();
  const idsRef = useRef(marketIds);

  useEffect(() => {
    idsRef.current = marketIds;
  }, [marketIds]);

  useEffect(() => {
    if (marketIds.length === 0) return;

    wsClient.connect();

    // Subscribe to all visible markets
    marketIds.forEach((id) => wsClient.subscribeMarket(id));

    const unsub = wsClient.on("price_update", (event) => {
      const data = event as unknown as PriceUpdateEvent;
      if (!idsRef.current.includes(data.marketId)) return;

      // Update markets list cache
      queryClient.setQueriesData<PaginatedResponse<MarketListItem>>(
        { queryKey: ["markets"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === data.marketId
                ? {
                    ...item,
                    yesPrice: data.yesPrice,
                    noPrice: data.noPrice,
                    volume: data.volume,
                    totalTrades: data.totalTrades,
                  }
                : item
            ),
          };
        }
      );
    });

    return () => {
      unsub();
      marketIds.forEach((id) => wsClient.unsubscribeMarket(id));
    };
  }, [marketIds, queryClient]);
}
