import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";

/**
 * GET /api/activity — Get recent platform activity
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(params.get("limit") || "20"), 100);

    const activities = await db.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiSuccess(activities);
  } catch (error) {
    console.error("[Activity API] Error:", error);
    return apiError("Failed to fetch activity", 500);
  }
}
