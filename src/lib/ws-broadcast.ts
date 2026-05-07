/**
 * Utility for Next.js API routes to broadcast events through the WS server.
 *
 * All broadcast functions are fire-and-forget — errors are logged but not
 * propagated, so a WS outage never blocks the API response.
 */

import type { TradeAction } from "@/lib/amm";

const WS_HTTP_URL = process.env.WS_HTTP_URL || "http://localhost:3002";
const WS_INTERNAL_KEY = process.env.WS_INTERNAL_KEY || "ws-internal-key";

interface BroadcastPayload {
  type: "market" | "user" | "all";
  marketId?: string;
  userId?: string;
  event: unknown;
}

async function broadcast(payload: BroadcastPayload): Promise<void> {
  try {
    await fetch(WS_HTTP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WS_INTERNAL_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[WS Broadcast] Failed:", error);
  }
}

/** Broadcast a price update to all subscribers of a market */
export async function broadcastPriceUpdate(
  marketId: string,
  data: { yesPrice: number; noPrice: number; volume: number }
) {
  await broadcast({
    type: "market",
    marketId,
    event: {
      type: "price_update",
      marketId,
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/** Broadcast a trade event to all subscribers of a market */
export async function broadcastTrade(
  marketId: string,
  data: {
    side: string;
    action: TradeAction;
    shares: number;
    price: number;
    timestamp: string;
  }
) {
  await broadcast({
    type: "market",
    marketId,
    event: {
      type: "trade",
      marketId,
      ...data,
    },
  });
}

/** Broadcast a resolution event to all subscribers */
export async function broadcastResolution(
  marketId: string,
  data: { outcome: string; title: string }
) {
  await broadcast({
    type: "market",
    marketId,
    event: {
      type: "resolved",
      marketId,
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/** Broadcast a position update to a specific user */
export async function broadcastPositionUpdate(
  userId: string,
  data: { marketId: string; side: string; action: TradeAction }
) {
  await broadcast({
    type: "user",
    userId,
    event: {
      type: "position_update",
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/** Broadcast a portfolio update to a specific user */
export async function broadcastPortfolioUpdate(
  userId: string,
  data: { newBalance: number }
) {
  await broadcast({
    type: "user",
    userId,
    event: {
      type: "portfolio_update",
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/** Broadcast an activity to all connected clients */
export async function broadcastActivity(data: {
  type: string;
  message: string;
  metadata?: unknown;
}) {
  await broadcast({
    type: "all",
    event: {
      type: "activity",
      activityType: data.type,
      message: data.message,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    },
  });
}
