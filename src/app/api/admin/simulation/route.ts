import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, apiError, parseBody } from "@/lib/api";
import {
  startMarketSim,
  stopMarketSim,
  isSimRunning,
  getSimulator,
} from "@/lib/simulation/startMarketSim";
import { z } from "zod";

const StartSchema = z.object({
  intensity: z.number().min(0).max(1).optional(),
});

/**
 * GET /api/admin/simulation — Get simulation status
 */
export async function GET() {
  try {
    await requireAdmin();

    const running = isSimRunning();
    const sim = getSimulator();
    const config = sim?.getConfig() ?? null;

    return apiSuccess({ running, config });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get simulation status";
    return apiError(message, 500);
  }
}

/**
 * POST /api/admin/simulation — Start or stop simulation
 *
 * Body: { action: "start" | "stop", intensity?: number }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await parseBody(request);
    const action = (body as Record<string, unknown>).action;

    if (action === "start") {
      const parsed = StartSchema.safeParse(body);
      const intensity = parsed.success ? parsed.data.intensity : undefined;

      await startMarketSim(intensity !== undefined ? { intensity } : undefined);

      return apiSuccess({
        status: "started",
        running: true,
        intensity: intensity ?? 0.5,
      });
    }

    if (action === "stop") {
      stopMarketSim();
      return apiSuccess({ status: "stopped", running: false });
    }

    return apiError('action must be "start" or "stop"', 400);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to control simulation";
    return apiError(message, 500);
  }
}
