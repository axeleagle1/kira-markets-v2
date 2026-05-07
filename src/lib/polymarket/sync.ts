/**
 * Polymarket sync service — fetches markets from Polymarket and upserts to our DB
 */

import { db } from "@/lib/db";
import { fetchAllActiveMarkets, fetchPolymarketMarkets } from "./client";
import { adaptMarketForSync, adaptMarketsForSync, type PolymarketMarket } from "./adapter";

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Compute LMSR AMM state from Polymarket prices.
 * Given yesPrice (p), we derive share quantities such that LMSR pricing matches.
 *
 * LMSR price: p_yes = exp(q_yes/b) / (exp(q_yes/b) + exp(q_no/b))
 * Setting q_no = 0 as reference: q_yes = b * ln(p / (1-p))
 *
 * b (liquidity parameter) is derived from Polymarket's liquidity pool size.
 */
function computeAmmState(
  yesPrice: number,
  noPrice: number,
  polymarketLiquidity: number
): { yesShares: number; noShares: number; liquidity: number } {
  // Clamp prices to avoid log(0) or log(inf)
  const p = Math.max(0.01, Math.min(0.99, yesPrice));

  // Liquidity parameter b: scale from Polymarket's pool size
  // Polymarket liquidity is in USDC; use it directly as b with a sensible floor
  const b = Math.max(polymarketLiquidity * 0.5, 500);

  // Derive share quantities from price
  const logOdds = Math.log(p / (1 - p));
  const yesShares = Math.round(b * logOdds);
  const noShares = 0; // reference point

  return {
    yesShares: Math.max(0, yesShares),
    noShares: Math.max(0, noShares),
    liquidity: Math.round(b),
  };
}

/**
 * Sync markets from Polymarket to our database
 * Uses upsert based on polymarketId to avoid duplicates
 */
export async function syncMarketsFromPolymarket(
  options: { limit?: number; category?: string } = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch markets from Polymarket
    let polymarketMarkets: PolymarketMarket[];

    if (options.limit) {
      polymarketMarkets = await fetchPolymarketMarkets({
        limit: options.limit,
        active: true,
        closed: false,
        category: options.category,
      });
    } else {
      polymarketMarkets = await fetchAllActiveMarkets(5); // Up to 500 markets
    }

    console.log(`[Polymarket Sync] Fetched ${polymarketMarkets.length} markets from Polymarket`);

    // Transform to our format
    const syncedMarkets = adaptMarketsForSync(polymarketMarkets);

    // Upsert each market
    for (const market of syncedMarkets) {
      try {
        // Compute AMM state from real Polymarket prices
        const amm = computeAmmState(market.yesPrice, market.noPrice, market.liquidity);

        // Check if market already exists
        const existing = await db.market.findUnique({
          where: { polymarketId: market.polymarketId },
          select: { id: true, status: true },
        });

        if (existing) {
          // Update existing market — sync prices AND AMM state from Polymarket
          await db.market.update({
            where: { polymarketId: market.polymarketId },
            data: {
              title: market.title,
              description: market.description,
              imageUrl: market.imageUrl,
              category: market.category,
              resolutionSource: market.resolutionSource,
              endsAt: market.endsAt,
              updatedAt: new Date(),
              // Real prices from Polymarket
              yesPrice: market.yesPrice,
              noPrice: market.noPrice,
              yesShares: amm.yesShares,
              noShares: amm.noShares,
              liquidity: amm.liquidity,
              // Don't update status if market has trades (preserve ACTIVE)
              ...(existing.status === "DRAFT" && { status: market.status }),
            },
          });
          result.updated++;
        } else {
          // Create new market with real Polymarket data
          await db.market.create({
            data: {
              polymarketId: market.polymarketId,
              slug: market.slug,
              title: market.title,
              description: market.description,
              imageUrl: market.imageUrl,
              category: market.category,
              status: "ACTIVE",
              resolutionSource: market.resolutionSource,
              startsAt: market.startsAt,
              endsAt: market.endsAt,
              // Real AMM state from Polymarket prices
              yesPrice: market.yesPrice,
              noPrice: market.noPrice,
              yesShares: amm.yesShares,
              noShares: amm.noShares,
              liquidity: amm.liquidity,
            },
          });
          result.created++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`${market.slug}: ${msg}`);
        result.skipped++;
      }
    }

    console.log(
      `[Polymarket Sync] Complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`
    );

    if (result.errors.length > 0) {
      console.warn(`[Polymarket Sync] Errors:`, result.errors.slice(0, 5));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Fetch failed: ${msg}`);
    console.error(`[Polymarket Sync] Failed:`, msg);
  }

  return result;
}

/**
 * Sync a single market by Polymarket ID
 */
export async function syncSingleMarket(polymarketId: string): Promise<boolean> {
  try {
    const markets = await fetchPolymarketMarkets({ limit: 1 });
    const market = markets.find((m) => m.id === polymarketId);

    if (!market) return false;

    const adapted = adaptMarketForSync(market);
    const amm = computeAmmState(adapted.yesPrice, adapted.noPrice, adapted.liquidity);

    await db.market.upsert({
      where: { polymarketId },
      create: {
        polymarketId: adapted.polymarketId,
        slug: adapted.slug,
        title: adapted.title,
        description: adapted.description,
        imageUrl: adapted.imageUrl,
        category: adapted.category,
        status: "ACTIVE",
        resolutionSource: adapted.resolutionSource,
        startsAt: adapted.startsAt,
        endsAt: adapted.endsAt,
        yesPrice: adapted.yesPrice,
        noPrice: adapted.noPrice,
        yesShares: amm.yesShares,
        noShares: amm.noShares,
        liquidity: amm.liquidity,
      },
      update: {
        title: adapted.title,
        description: adapted.description,
        imageUrl: adapted.imageUrl,
        category: adapted.category,
        resolutionSource: adapted.resolutionSource,
        endsAt: adapted.endsAt,
        updatedAt: new Date(),
        yesPrice: adapted.yesPrice,
        noPrice: adapted.noPrice,
        yesShares: amm.yesShares,
        noShares: amm.noShares,
        liquidity: amm.liquidity,
      },
    });

    return true;
  } catch (error) {
    console.error(`[Polymarket Sync] Failed to sync market ${polymarketId}:`, error);
    return false;
  }
}

/**
 * Get sync status — count of synced markets
 */
export async function getSyncStatus() {
  const total = await db.market.count();
  const withPolymarketId = await db.market.count({
    where: { polymarketId: { not: null } },
  });
  const active = await db.market.count({
    where: { status: "ACTIVE" },
  });

  return {
    total,
    fromPolymarket: withPolymarketId,
    active,
    localOnly: total - withPolymarketId,
  };
}
