/**
 * Polymarket API client — fetches market data from Gamma API
 */

import type { PolymarketMarket } from "./adapter";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

interface FetchMarketsOptions {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  category?: string;
}

/**
 * Fetch markets from Polymarket Gamma API
 */
export async function fetchPolymarketMarkets(
  options: FetchMarketsOptions = {}
): Promise<PolymarketMarket[]> {
  const { limit = 100, offset = 0, active = true, closed = false, category } = options;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    active: String(active),
    closed: String(closed),
  });

  if (category) {
    params.set("category", category);
  }

  const url = `${GAMMA_API_BASE}/markets?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Gamma API returns array directly
  if (Array.isArray(data)) {
    return data as PolymarketMarket[];
  }

  // Or it might be wrapped in a data field
  if (data && Array.isArray(data.data)) {
    return data.data as PolymarketMarket[];
  }

  return [];
}

/**
 * Fetch a single market by slug or conditionId
 */
export async function fetchPolymarketMarket(
  identifier: string
): Promise<PolymarketMarket | null> {
  // Try by slug first
  const url = `${GAMMA_API_BASE}/markets?slug=${identifier}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const markets = Array.isArray(data) ? data : data?.data || [];

  return markets[0] || null;
}

/**
 * Fetch all active markets (paginated)
 */
export async function fetchAllActiveMarkets(
  maxPages: number = 10
): Promise<PolymarketMarket[]> {
  const allMarkets: PolymarketMarket[] = [];
  const pageSize = 100;

  for (let page = 0; page < maxPages; page++) {
    const markets = await fetchPolymarketMarkets({
      limit: pageSize,
      offset: page * pageSize,
      active: true,
      closed: false,
    });

    allMarkets.push(...markets);

    if (markets.length < pageSize) break;
  }

  return allMarkets;
}
