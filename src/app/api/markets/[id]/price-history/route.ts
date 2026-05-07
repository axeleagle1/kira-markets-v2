import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";

/**
 * GET /api/markets/[id]/price-history — Get price history for charts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "200");

    const history = await db.priceHistory.findMany({
      where: { marketId: id },
      orderBy: { timestamp: "asc" },
      take: Math.min(limit, 1000),
      select: {
        yesPrice: true,
        noPrice: true,
        volume: true,
        timestamp: true,
      },
    });

    return apiSuccess(
      history.map((h) => ({
        yesPrice: Number(h.yesPrice),
        noPrice: Number(h.noPrice),
        volume: Number(h.volume),
        timestamp: h.timestamp.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[Price History API] Error:", error);
    return apiError("Failed to fetch price history", 500);
  }
}
