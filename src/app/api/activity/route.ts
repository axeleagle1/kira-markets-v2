import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api";

/**
 * GET /api/activity — Get recent activity for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return apiError("Unauthorized", 401);

    const params = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(params.get("limit") || "20"), 100);

    const activities = await db.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiSuccess(activities);
  } catch (error) {
    console.error("[Activity API] Error:", error);
    return apiError("Failed to fetch activity", 500);
  }
}
