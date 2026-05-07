import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, parseBody } from "@/lib/api";
import { z } from "zod";

const CreateMarketSchema = z.object({
  title: z.string().min(10).max(500),
  description: z.string().min(20),
  category: z.enum([
    "POLITICS",
    "CRYPTO",
    "SPORTS",
    "TECHNOLOGY",
    "ENTERTAINMENT",
    "SCIENCE",
    "ECONOMICS",
    "WEATHER",
    "OTHER",
  ]),
  imageUrl: z.string().url().optional(),
  endsAt: z.string().datetime(),
  initialLiquidity: z.number().positive().default(1000),
});

/**
 * GET /api/admin/markets — List all markets (admin view)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const page = parseInt(params.get("page") || "1");
    const pageSize = Math.min(parseInt(params.get("pageSize") || "20"), 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [markets, total] = await Promise.all([
      db.market.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          createdBy: { select: { username: true, email: true } },
          _count: { select: { positions: true, trades: true } },
        },
      }),
      db.market.count({ where }),
    ]);

    return apiSuccess({
      items: markets.map((m) => ({
        ...m,
        yesPrice: Number(m.yesPrice),
        noPrice: Number(m.noPrice),
        volume: Number(m.volume),
        liquidity: Number(m.liquidity),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch markets";
    console.error("[Admin Markets API] Error:", error);
    return apiError(message, 500);
  }
}

/**
 * POST /api/admin/markets — Create a new market
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await parseBody(request);
    const parsed = CreateMarketSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { title, description, category, imageUrl, endsAt, initialLiquidity } =
      parsed.data;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    // Ensure unique slug
    const existing = await db.market.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const market = await db.market.create({
      data: {
        slug: finalSlug,
        title,
        description,
        category,
        imageUrl,
        endsAt: new Date(endsAt),
        createdById: admin.id,
        status: "ACTIVE",
        liquidity: initialLiquidity,
        yesShares: initialLiquidity / 2,
        noShares: initialLiquidity / 2,
        yesPrice: 0.5,
        noPrice: 0.5,
      },
    });

    return apiSuccess({
      ...market,
      yesPrice: Number(market.yesPrice),
      noPrice: Number(market.noPrice),
      volume: Number(market.volume),
      liquidity: Number(market.liquidity),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create market";
    console.error("[Admin Markets API] Error:", error);
    return apiError(message, 500);
  }
}
