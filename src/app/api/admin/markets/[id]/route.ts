import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, parseBody, apiNotFound } from "@/lib/api";
import { z } from "zod";

const UpdateMarketSchema = z.object({
  title: z.string().min(10).max(500).optional(),
  description: z.string().min(20).optional(),
  category: z
    .enum([
      "POLITICS",
      "CRYPTO",
      "SPORTS",
      "TECH",
      "ENTERTAINMENT",
      "SCIENCE",
      "BUSINESS",
      "WEATHER",
      "OTHER",
    ])
    .optional(),
  imageUrl: z.string().url().optional(),
  endsAt: z.string().datetime().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "RESOLVED", "CANCELLED"])
    .optional(),
});

/**
 * PATCH /api/admin/markets/[id] — Update a market
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await parseBody(request);
    const parsed = UpdateMarketSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const market = await db.market.findUnique({ where: { id } });
    if (!market) return apiNotFound("Market not found");

    const data: Record<string, unknown> = {};
    if (parsed.data.title) data.title = parsed.data.title;
    if (parsed.data.description) data.description = parsed.data.description;
    if (parsed.data.category) data.category = parsed.data.category;
    if (parsed.data.imageUrl) data.imageUrl = parsed.data.imageUrl;
    if (parsed.data.endsAt) data.endsAt = new Date(parsed.data.endsAt);
    if (parsed.data.status) data.status = parsed.data.status;

    const updated = await db.market.update({
      where: { id },
      data,
    });

    return apiSuccess({
      ...updated,
      yesPrice: Number(updated.yesPrice),
      noPrice: Number(updated.noPrice),
      volume: Number(updated.volume),
      liquidity: Number(updated.liquidity),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update market";
    console.error("[Admin Market API] Error:", error);
    return apiError(message, 500);
  }
}

/**
 * DELETE /api/admin/markets/[id] — Delete a market (only if no trades)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const market = await db.market.findUnique({
      where: { id },
      include: { _count: { select: { trades: true } } },
    });
    if (!market) return apiNotFound("Market not found");

    if (market._count.trades > 0) {
      return apiError(
        "Cannot delete market with existing trades. Cancel it instead.",
        400
      );
    }

    await db.market.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete market";
    console.error("[Admin Market API] Error:", error);
    return apiError(message, 500);
  }
}
