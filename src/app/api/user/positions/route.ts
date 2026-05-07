import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api";
import { toNumber, calculatePnL } from "@/lib/amm";

/**
 * GET /api/user/positions — Get user's open positions
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return apiError("Unauthorized", 401);

    const positions = await db.position.findMany({
      where: { userId: user.id },
      include: {
        market: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            yesPrice: true,
            noPrice: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = positions.map((pos) => {
      const shares = toNumber(pos.shares);
      const avgPrice = toNumber(pos.avgPrice);
      const currentYesPrice = toNumber(pos.market.yesPrice);
      const pnl = calculatePnL(pos.side, shares, avgPrice, currentYesPrice);

      return {
        id: pos.id,
        marketId: pos.marketId,
        side: pos.side,
        shares,
        avgPrice,
        totalCost: toNumber(pos.totalCost),
        currentValue: shares * (pos.side === "YES" ? currentYesPrice : 1 - currentYesPrice),
        unrealizedPnl: pnl,
        market: {
          ...pos.market,
          yesPrice: currentYesPrice,
          noPrice: toNumber(pos.market.noPrice),
        },
      };
    });

    return apiSuccess(enriched);
  } catch (error) {
    console.error("[User Positions API] Error:", error);
    return apiError("Failed to fetch positions", 500);
  }
}
