import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, getPagination } from "@/lib/api";

/**
 * GET /api/markets — List markets with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { page, pageSize, skip, take } = getPagination(request.url);
    const params = request.nextUrl.searchParams;

    const status = params.get("status") || "ACTIVE";
    const category = params.get("category");
    const search = params.get("search");
    const sort = params.get("sort") || "volume";

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;
    if (category) where.category = category.toUpperCase();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "volume": orderBy.volume = "desc"; break;
      case "newest": orderBy.createdAt = "desc"; break;
      case "ending": orderBy.endsAt = "asc"; break;
      case "trades": orderBy.totalTrades = "desc"; break;
      default: orderBy.volume = "desc";
    }

    const [markets, total] = await Promise.all([
      db.market.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
          category: true,
          status: true,
          yesPrice: true,
          noPrice: true,
          volume: true,
          totalTrades: true,
          endsAt: true,
        },
      }),
      db.market.count({ where }),
    ]);

    const serialized = markets.map((m) => ({
      ...m,
      yesPrice: Number(m.yesPrice),
      noPrice: Number(m.noPrice),
      volume: Number(m.volume),
    }));

    return apiSuccess({
      items: serialized,
      total,
      page,
      pageSize,
      hasMore: skip + take < total,
    });
  } catch (error) {
    console.error("[Markets API] Error:", error);
    return apiError("Failed to fetch markets", 500);
  }
}
