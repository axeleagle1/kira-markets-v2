import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api";

/**
 * GET /api/markets/[id] — Get market details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const market = await db.market.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        createdBy: { select: { username: true, displayName: true } },
        _count: { select: { positions: true, trades: true } },
      },
    });

    if (!market) return apiNotFound("Market not found");

    return apiSuccess({
      ...market,
      yesPrice: Number(market.yesPrice),
      noPrice: Number(market.noPrice),
      volume: Number(market.volume),
      liquidity: Number(market.liquidity),
      yesShares: Number(market.yesShares),
      noShares: Number(market.noShares),
    });
  } catch (error) {
    console.error("[Market API] Error:", error);
    return apiError("Failed to fetch market", 500);
  }
}
