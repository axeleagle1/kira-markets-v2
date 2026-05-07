import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getQuote } from "@/lib/trades";
import { z } from "zod";

const QuoteParamsSchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["YES", "NO"]),
  shares: z.coerce.number().positive().max(100000),
  action: z.enum(["BUY", "SELL"]).default("BUY"),
});

/**
 * GET /api/trades/quote — Get a trade quote without executing
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const parsed = QuoteParamsSchema.safeParse({
      marketId: params.get("marketId"),
      side: params.get("side"),
      shares: params.get("shares"),
      action: params.get("action") || "BUY",
    });

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { marketId, side, shares, action } = parsed.data;
    const quote = await getQuote(marketId, side, shares, action);
    return apiSuccess(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get quote";
    console.error("[Quote API] Error:", error);
    return apiError(message, 400);
  }
}
