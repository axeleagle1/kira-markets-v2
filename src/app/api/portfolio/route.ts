import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api";
import { calculatePnL, getPositionValuation, toNumber } from "@/lib/amm";

/**
 * GET /api/portfolio — Get user portfolio with positions and P&L
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
            outcome: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let totalValue = 0;
    let totalInvested = 0;
    let totalPnl = 0;

    const enriched = positions.map((pos) => {
      const shares = toNumber(pos.shares);
      const avgPrice = toNumber(pos.avgPrice);
      const totalCost = toNumber(pos.totalCost);
      const currentYesPrice = toNumber(pos.market.yesPrice);
      const currentNoPrice = toNumber(pos.market.noPrice);

      const { unrealizedPnl, currentValue } = getPositionValuation(
        pos.side,
        shares,
        avgPrice,
        currentYesPrice
      );

      totalValue += currentValue;
      totalInvested += totalCost;
      totalPnl += unrealizedPnl;

      return {
        id: pos.id,
        marketId: pos.marketId,
        side: pos.side,
        shares,
        avgPrice,
        totalCost,
        currentValue,
        unrealizedPnl,
        market: {
          id: pos.market.id,
          slug: pos.market.slug,
          title: pos.market.title,
          status: pos.market.status,
          yesPrice: currentYesPrice,
          noPrice: currentNoPrice,
          outcome: pos.market.outcome,
        },
      };
    });

    return apiSuccess({
      balance: toNumber(user.balance),
      totalPnl: toNumber(user.totalPnl) + totalPnl,
      totalValue,
      totalInvested,
      positions: enriched,
    });
  } catch (error) {
    console.error("[Portfolio API] Error:", error);
    return apiError("Failed to fetch portfolio", 500);
  }
}
