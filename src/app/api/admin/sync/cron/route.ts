import { NextResponse } from "next/server";
import { syncMarketsFromPolymarket } from "@/lib/polymarket";

/**
 * GET /api/admin/sync/cron
 *
 * This endpoint is called by Vercel Cron Jobs to automatically sync markets.
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/admin/sync/cron",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */
export async function GET() {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = process.env.CRON_SECRET;

    // In production, verify the request is from Vercel Cron
    // For now, we'll allow it for development

    console.log("[Cron Sync] Starting automatic sync...");

    const result = await syncMarketsFromPolymarket({
      limit: 100,
    });

    console.log(`[Cron Sync] Complete: ${result.created} created, ${result.updated} updated`);

    return NextResponse.json({
      success: true,
      data: {
        message: "Cron sync completed",
        timestamp: new Date().toISOString(),
        ...result,
      },
    });
  } catch (error) {
    console.error("[Cron Sync] Error:", error);
    return NextResponse.json(
      { success: false, error: "Cron sync failed" },
      { status: 500 }
    );
  }
}
