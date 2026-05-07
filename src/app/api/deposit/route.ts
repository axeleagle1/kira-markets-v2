import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api";
import { toNumber } from "@/lib/amm";

const DEMO_AMOUNT = 1000;

/**
 * POST /api/deposit — Add demo funds to user balance
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) return apiError("Unauthorized", 401);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: DEMO_AMOUNT,
        },
      },
    });

    return apiSuccess({
      newBalance: toNumber(updated.balance),
      deposited: DEMO_AMOUNT,
    });
  } catch (error) {
    console.error("[Deposit API] Error:", error);
    return apiError("Failed to process deposit", 500);
  }
}
