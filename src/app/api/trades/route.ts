import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { apiSuccess, apiError, parseBody } from "@/lib/api";
import { executeMarketTrade } from "@/lib/trades";
import {
  broadcastPriceUpdate,
  broadcastTrade,
  broadcastPositionUpdate,
  broadcastPortfolioUpdate,
} from "@/lib/ws-broadcast";
import { z } from "zod";

const TradeSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["YES", "NO"]),
  shares: z.number().positive().max(100000),
  action: z.enum(["BUY", "SELL"]).default("BUY"),
});

/**
 * POST /api/trades — Execute a market order (buy or sell)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return apiError("Unauthorized", 401);

    const body = await parseBody(request);
    const parsed = TradeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { marketId, side, shares, action } = parsed.data;

    const result = await executeMarketTrade(
      user.id,
      marketId,
      side,
      shares,
      action
    );

    // Broadcast real-time updates (fire-and-forget)
    broadcastPriceUpdate(marketId, {
      yesPrice: result.newYesPrice,
      noPrice: result.newNoPrice,
      volume: result.newVolume,
    });
    broadcastTrade(marketId, {
      side,
      action,
      shares: result.shares,
      price: result.price,
      timestamp: new Date().toISOString(),
    });
    broadcastPositionUpdate(user.id, {
      marketId,
      side,
      action,
    });
    broadcastPortfolioUpdate(user.id, {
      newBalance: result.newBalance,
    });

    return apiSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute trade";
    console.error("[Trades API] Error:", error);
    return apiError(message, 400);
  }
}
