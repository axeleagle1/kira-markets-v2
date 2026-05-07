export { fetchPolymarketMarkets, fetchPolymarketMarket, fetchAllActiveMarkets } from "./client";
export { adaptMarketForSync, adaptMarketsForSync, adaptForMarketList } from "./adapter";
export { syncMarketsFromPolymarket, syncSingleMarket, getSyncStatus } from "./sync";
export type { PolymarketMarket, PolymarketEvent, SyncedMarket } from "./adapter";
export type { SyncResult } from "./sync";
