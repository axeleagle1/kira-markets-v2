import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, parseBody, apiNotFound } from "@/lib/api";
import { calculateResolution, toNumber } from "@/lib/amm";
import { broadcastResolution, broadcastActivity } from "@/lib/ws-broadcast";
import { z } from "zod";

const ResolveSchema = z.object({
  outcome: z.enum(["YES", "NO"]),
});

/**
 * POST /api/admin/markets/[id]/resolve — Resolve a market
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await parseBody(request);
    const parsed = ResolveSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const market = await db.market.findUnique({
      where: { id },
      include: {
        positions: true,
      },
    });

    if (!market) return apiNotFound("Market not found");

    if (market.status === "RESOLVED") {
      return apiError("Market is already resolved", 400);
    }

    if (market.status === "CANCELLED") {
      return apiError("Cannot resolve a cancelled market", 400);
    }

    const { outcome } = parsed.data;

    // Resolve the market and settle positions in a transaction
    await db.$transaction(async (tx) => {
      // Update market status
      await tx.market.update({
        where: { id },
        data: {
          status: "RESOLVED",
          outcome,
          resolvedAt: new Date(),
        },
      });

      // Settle all positions
      for (const pos of market.positions) {
        const shares = toNumber(pos.shares);
        const avgPrice = toNumber(pos.avgPrice);
        const payout = calculateResolution(pos.side, shares, avgPrice, outcome);

        if (payout > 0) {
          // Credit user balance
          await tx.user.update({
            where: { id: pos.userId },
            data: {
              balance: { increment: payout },
              totalPnl: { increment: payout - toNumber(pos.totalCost) },
            },
          });
        }

        // Update position with realized P&L
        await tx.position.update({
          where: { id: pos.id },
          data: {
            realizedPnl: payout - toNumber(pos.totalCost),
          },
        });
      }

      // Create activity record
      await tx.activity.create({
        data: {
          type: "MARKET_RESOLVED",
          message: `Market resolved as ${outcome}: ${market.title}`,
          metadata: { marketId: id, outcome },
        },
      });
    });

    // Broadcast resolution event
    broadcastResolution(id, { outcome, title: market.title });
    broadcastActivity({
      type: "MARKET_RESOLVED",
      message: `Market resolved as ${outcome}: ${market.title}`,
      metadata: { marketId: id, outcome },
    });

    return apiSuccess({
      resolved: true,
      outcome,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve market";
    console.error("[Resolve API] Error:", error);
    return apiError(message, 500);
  }
}
