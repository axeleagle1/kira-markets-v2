/**
 * One-shot script to re-sync all markets with real Polymarket prices.
 * Run: npx tsx scripts/sync-prices.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const POLYMARKET_API = "https://gamma-api.polymarket.com";

interface PMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volumeNum: number;
  liquidityNum: number;
}

function computeAmmState(
  yesPrice: number,
  noPrice: number,
  polymarketLiquidity: number
) {
  const p = Math.max(0.01, Math.min(0.99, yesPrice));
  const b = Math.max(polymarketLiquidity * 0.5, 500);
  const logOdds = Math.log(p / (1 - p));
  const yesShares = Math.round(b * logOdds);
  return {
    yesShares: Math.max(0, yesShares),
    noShares: 0,
    liquidity: Math.round(b),
  };
}

function parsePrices(outcomes: string, outcomePrices: string) {
  try {
    const outs: string[] = JSON.parse(outcomes || "[]");
    const prices: string[] = JSON.parse(outcomePrices || "[]");
    const yi = outs.findIndex((o) => o?.toLowerCase() === "yes");
    const ni = outs.findIndex((o) => o?.toLowerCase() === "no");
    return {
      yesPrice: parseFloat(prices[yi >= 0 ? yi : 0]) || 0.5,
      noPrice: parseFloat(prices[ni >= 0 ? ni : 1]) || 0.5,
    };
  } catch {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }
}

async function fetchMarkets(limit: number): Promise<PMarket[]> {
  const all: PMarket[] = [];
  let offset = 0;
  while (all.length < limit) {
    const batch = Math.min(100, limit - all.length);
    const url = `${POLYMARKET_API}/markets?limit=${batch}&offset=${offset}&active=true&closed=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data: PMarket[] = await res.json();
    if (!data.length) break;
    all.push(...data);
    offset += data.length;
  }
  return all.slice(0, limit);
}

async function main() {
  console.log("Fetching markets from Polymarket...");
  const pmMarkets = await fetchMarkets(200);
  console.log(`Fetched ${pmMarkets.length} markets from Polymarket`);

  const localMarkets = await db.market.findMany({
    where: { polymarketId: { not: null } },
    select: { id: true, polymarketId: true, slug: true },
  });
  console.log(`Found ${localMarkets.length} local markets with polymarketId`);

  let updated = 0;
  let skipped = 0;

  for (const local of localMarkets) {
    const pm = pmMarkets.find((m) => m.id === local.polymarketId);
    if (!pm) {
      skipped++;
      continue;
    }

    const { yesPrice, noPrice } = parsePrices(pm.outcomes, pm.outcomePrices);
    const amm = computeAmmState(yesPrice, noPrice, pm.liquidityNum);

    await db.market.update({
      where: { id: local.id },
      data: {
        yesPrice,
        noPrice,
        yesShares: amm.yesShares,
        noShares: amm.noShares,
        liquidity: amm.liquidity,
        volume: pm.volumeNum || 0,
        updatedAt: new Date(),
      },
    });

    console.log(`  ${local.slug}: YES ${yesPrice.toFixed(2)} / NO ${noPrice.toFixed(2)} (b=${amm.liquidity})`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (not found in Polymarket API)`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
