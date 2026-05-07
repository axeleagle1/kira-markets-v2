/**
 * Simulation bot user management.
 *
 * Creates and caches a system user that the simulator trades through.
 * All simulated trades flow through executeMarketTrade with this userId,
 * so they go through the full validation pipeline (FOR UPDATE locks,
 * balance checks, position tracking, etc.).
 */

import { db } from "@/lib/db";

const BOT_SUPABASE_ID = "simulation-bot-system";
const BOT_EMAIL = "sim-bot@kira-markets.internal";
const BOT_INITIAL_BALANCE = 1_000_000;

let cachedBotId: string | null = null;

/**
 * Get or create the simulation bot user. Returns the user's database ID.
 * Caches the result in memory so subsequent calls avoid a DB query.
 */
export async function getBotUserId(): Promise<string> {
  if (cachedBotId) return cachedBotId;

  const existing = await db.user.findUnique({
    where: { supabaseId: BOT_SUPABASE_ID },
    select: { id: true },
  });

  if (existing) {
    cachedBotId = existing.id;
    return existing.id;
  }

  // Create the bot user if it doesn't exist
  const created = await db.user.create({
    data: {
      supabaseId: BOT_SUPABASE_ID,
      email: BOT_EMAIL,
      username: "market-sim-bot",
      displayName: "Market Simulator",
      role: "USER",
      balance: BOT_INITIAL_BALANCE,
    },
    select: { id: true },
  });

  cachedBotId = created.id;
  console.log("[SIMULATION] Created bot user:", created.id);
  return created.id;
}

/**
 * Ensure the bot user has sufficient balance. Tops up if below threshold.
 */
export async function ensureBotBalance(minimum = 10_000): Promise<void> {
  if (!cachedBotId) await getBotUserId();

  const user = await db.user.findUnique({
    where: { id: cachedBotId! },
    select: { balance: true },
  });

  if (user && Number(user.balance) < minimum) {
    await db.user.update({
      where: { id: cachedBotId! },
      data: { balance: BOT_INITIAL_BALANCE },
    });
    console.log(
      `[SIMULATION] Bot balance topped up to $${BOT_INITIAL_BALANCE}`
    );
  }
}
