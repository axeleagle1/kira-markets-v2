import { NextRequest, NextResponse } from "next/server";
import { syncMarketsFromPolymarket, getSyncStatus } from "@/lib/polymarket";

/**
 * GET /api/admin/sync — Get sync status
 */
export async function GET() {
  try {
    const status = await getSyncStatus();
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error("[Sync API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sync — Trigger market sync from Polymarket
 *
 * Body (optional):
 *   - limit: number of markets to sync (default: 100)
 *   - category: filter by category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { limit, category } = body;

    console.log(`[Sync API] Starting sync...`, { limit, category });

    const result = await syncMarketsFromPolymarket({
      limit: limit || 100,
      category,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Sync completed",
        ...result,
      },
    });
  } catch (error) {
    console.error("[Sync API] Error:", error);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
