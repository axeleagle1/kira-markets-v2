/**
 * Polymarket API adapter — transforms Polymarket data to our internal types
 */

import type { MarketCategory, MarketStatus } from "@prisma/client";

// ─── Polymarket API Types ──────────────────────────────

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  category: string;
  startDate: string;
  endDate: string;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  category: string;
  outcomes: string; // JSON string: '["Yes","No"]'
  outcomePrices: string; // JSON string: '["0.5","0.5"]'
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  resolutionSource: string;
  clobTokenIds: string; // JSON string with token IDs
  createdAt: string;
  updatedAt: string;
}

// ─── Our Internal Types ────────────────────────────────

export interface SyncedMarket {
  polymarketId: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: MarketCategory;
  status: MarketStatus;
  resolutionSource: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
}

// ─── Category Mapping ──────────────────────────────────

const CATEGORY_MAP: Record<string, MarketCategory> = {
  politics: "POLITICS",
  crypto: "CRYPTO",
  sports: "SPORTS",
  entertainment: "ENTERTAINMENT",
  science: "SCIENCE",
  technology: "TECHNOLOGY",
  tech: "TECHNOLOGY",
  economics: "ECONOMICS",
  economy: "ECONOMICS",
  weather: "WEATHER",
  other: "OTHER",
};

function mapCategory(category: string | null | undefined): MarketCategory {
  if (!category) return "OTHER";
  const normalized = category.toLowerCase().trim();
  return CATEGORY_MAP[normalized] || "OTHER";
}

function mapStatus(active: boolean, closed: boolean): MarketStatus {
  if (closed) return "RESOLVED";
  if (active) return "ACTIVE";
  return "PAUSED";
}

function parseJsonArray<T>(json: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// ─── Adapter Functions ─────────────────────────────────

/**
 * Transform a Polymarket market to our internal format for DB insertion
 */
export function adaptMarketForSync(pm: PolymarketMarket): SyncedMarket {
  const outcomes = parseJsonArray<string>(pm.outcomes || "[]", ["Yes", "No"]);
  const prices = parseJsonArray<string>(pm.outcomePrices || "[]", ["0.5", "0.5"]);

  const yesIndex = outcomes.findIndex((o) => o?.toLowerCase() === "yes");
  const noIndex = outcomes.findIndex((o) => o?.toLowerCase() === "no");

  const yesPrice = parseFloat(prices[yesIndex >= 0 ? yesIndex : 0]) || 0.5;
  const noPrice = parseFloat(prices[noIndex >= 0 ? noIndex : 1]) || 0.5;

  return {
    polymarketId: pm.id,
    slug: pm.slug || `market-${pm.id}`,
    title: pm.question || pm.slug || "Untitled Market",
    description: pm.description || "",
    imageUrl: pm.image || pm.icon || null,
    category: mapCategory(pm.category),
    status: mapStatus(pm.active ?? true, pm.closed ?? false),
    resolutionSource: pm.resolutionSource || null,
    startsAt: pm.startDate ? new Date(pm.startDate) : null,
    endsAt: pm.endDate ? new Date(pm.endDate) : null,
    yesPrice,
    noPrice,
    volume: pm.volumeNum || 0,
    liquidity: pm.liquidityNum || 0,
  };
}

/**
 * Transform multiple Polymarket markets for sync
 */
export function adaptMarketsForSync(markets: PolymarketMarket[]): SyncedMarket[] {
  return markets.map(adaptMarketForSync);
}

/**
 * Transform a Polymarket market for display in our UI (MarketListItem format)
 */
export function adaptForMarketList(pm: PolymarketMarket) {
  const outcomes = parseJsonArray<string>(pm.outcomes || "[]", ["Yes", "No"]);
  const prices = parseJsonArray<string>(pm.outcomePrices || "[]", ["0.5", "0.5"]);

  const yesIndex = outcomes.findIndex((o) => o?.toLowerCase() === "yes");
  const noIndex = outcomes.findIndex((o) => o?.toLowerCase() === "no");

  const yesPrice = parseFloat(prices[yesIndex >= 0 ? yesIndex : 0]) || 0.5;
  const noPrice = parseFloat(prices[noIndex >= 0 ? noIndex : 1]) || 0.5;

  return {
    id: pm.id,
    slug: pm.slug || `market-${pm.id}`,
    title: pm.question || pm.slug || "Untitled Market",
    imageUrl: pm.image || pm.icon || null,
    category: mapCategory(pm.category),
    status: mapStatus(pm.active ?? true, pm.closed ?? false),
    yesPrice,
    noPrice,
    volume: pm.volumeNum || 0,
    totalTrades: 0,
    endsAt: pm.endDate || null,
  };
}
