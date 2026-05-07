// ─── Market Types ─────────────────────────────────────

export interface MarketData {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string;
  status: string;
  outcome: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  resolutionSource: string | null;
  liquidity: number;
  yesShares: number;
  noShares: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
  totalTrades: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { username: string; displayName: string | null } | null;
  _count?: { positions: number; trades: number };
}

export interface MarketListItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  category: string;
  status: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  totalTrades: number;
  endsAt: string | null;
}

// ─── Trade Types ──────────────────────────────────────

export type TradeAction = "BUY" | "SELL";

export interface TradeQuoteRequest {
  marketId: string;
  side: "YES" | "NO";
  shares: number;
  action?: TradeAction;
}

export interface TradeQuoteResponse {
  side: "YES" | "NO";
  action: TradeAction;
  shares: number;
  cost: number;
  fee: number;
  totalCost: number;
  effectivePrice: number;
  newYesPrice: number;
  newNoPrice: number;
  priceImpact: number;
  slippage: number;
  currentYesPrice: number;
  currentNoPrice: number;
}

export interface ExecuteTradeRequest {
  marketId: string;
  side: "YES" | "NO";
  shares: number;
  action?: TradeAction;
}

export interface ExecuteTradeResponse {
  tradeId: string;
  side: "YES" | "NO";
  action: TradeAction;
  shares: number;
  price: number;
  cost: number;
  fee: number;
  newBalance: number;
  newYesPrice: number;
  newNoPrice: number;
  newVolume: number;
}

// ─── Position Types ───────────────────────────────────

export interface PositionData {
  id: string;
  marketId: string;
  side: "YES" | "NO";
  shares: number;
  avgPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedPnl: number;
  market: {
    id: string;
    slug: string;
    title: string;
    status: string;
    yesPrice: number;
    noPrice: number;
    outcome?: string | null;
  };
}

// ─── Portfolio Types ──────────────────────────────────

export interface PortfolioData {
  balance: number;
  totalPnl: number;
  positions: PositionData[];
  totalValue: number;
  totalInvested: number;
}

// ─── WebSocket Event Types ────────────────────────────

export type WSEventType =
  | "price_update"
  | "trade"
  | "resolved"
  | "position_update"
  | "portfolio_update"
  | "activity";

export interface PriceUpdateEvent {
  type: "price_update";
  marketId: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  timestamp: string;
}

export interface TradeEvent {
  type: "trade";
  marketId: string;
  side: "YES" | "NO";
  action: TradeAction;
  shares: number;
  price: number;
  timestamp: string;
}

export interface ResolvedEvent {
  type: "resolved";
  marketId: string;
  outcome: string;
  title: string;
  timestamp: string;
}

export interface PositionUpdateEvent {
  type: "position_update";
  marketId: string;
  side: "YES" | "NO";
  action: TradeAction;
}

export interface PortfolioUpdateEvent {
  type: "portfolio_update";
  newBalance: number;
}

export interface ActivityEvent {
  type: "activity";
  activityType: string;
  message: string;
  metadata?: unknown;
  timestamp: string;
}

// ─── API Response Types ───────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
