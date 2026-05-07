"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useMarketsPriceUpdates } from "@/hooks/useMarketPrice";
import { MarketCard } from "@/components/trading/market-card";
import { TradingPanel } from "@/components/trading/trading-panel";
import {
  LayoutGrid,
  Landmark,
  Bitcoin,
  Trophy,
  BarChart3,
  Cpu,
  Film,
  Zap,
  TrendingUp,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { id: "All", label: "All", icon: LayoutGrid },
  { id: "Trending", label: "Trending", icon: TrendingUp },
  { id: "Politics", label: "Politics", icon: Landmark },
  { id: "Crypto", label: "Crypto", icon: Bitcoin },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Economics", label: "Economy", icon: BarChart3 },
  { id: "Technology", label: "Tech", icon: Cpu },
  { id: "Entertainment", label: "Entertainment", icon: Film },
  { id: "Science", label: "Science", icon: Zap },
];

const SORTS = [
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Newest" },
  { value: "ending", label: "Ending Soon" },
  { value: "trades", label: "Most Traded" },
];

export default function MarketsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("volume");
  const [selectedTrade, setSelectedTrade] = useState<{
    marketId: string;
    side: "YES" | "NO";
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const params = useMemo(
    () => ({
      status: "ACTIVE",
      category: category === "All" || category === "Trending" ? undefined : category,
      search: debouncedSearch || undefined,
      sort: category === "Trending" ? "trades" : sort,
      pageSize: 30,
    }),
    [debouncedSearch, category, sort]
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMarkets(params);

  const markets = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const total = data?.pages[0]?.total ?? 0;
  const marketIds = useMemo(() => markets.map((m) => m.id), [markets]);
  useMarketsPriceUpdates(marketIds);

  const handleTrade = (marketId: string, side: "YES" | "NO") => {
    setSelectedTrade({ marketId, side });
  };

  const selectedMarket = markets.find((m) => m.id === selectedTrade?.marketId);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-3">
      {/* Category Scroller */}
      <div className="mb-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap"
                style={{
                  background: active ? "var(--bg-surface)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-dim)",
                  borderBottom: active ? "2px solid var(--yellow)" : "2px solid transparent",
                }}
                onClick={() => setCategory(cat.id)}
              >
                <Icon size={12} strokeWidth={active ? 2.2 : 1.6} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort + Search + Count */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-0.5">
          {SORTS.map((s) => (
            <button
              key={s.value}
              className="px-2 py-1 text-[10px] font-medium rounded transition-colors"
              style={{
                color: sort === s.value ? "var(--fg)" : "var(--fg-dim)",
                background: sort === s.value ? "var(--bg-surface)" : "transparent",
              }}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <div className="relative lg:hidden">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-dim)" }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="pl-7 pr-2 py-1 text-[11px] rounded outline-none w-32"
              style={{
                background: "var(--bg-surface)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          {data && (
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "var(--fg-dim)" }}>
              {total} markets
            </span>
          )}
        </div>
      </div>

      {/* Market Grid — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {isLoading &&
          [...Array(9)].map((_, i) => (
            <div
              key={i}
              className="rounded"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                height: 180,
              }}
            >
              <div className="p-3">
                <div className="h-3 w-16 mb-2 skeleton rounded" />
                <div className="h-4 w-3/4 mb-1 skeleton rounded" />
                <div className="h-4 w-1/2 mb-3 skeleton rounded" />
                <div className="h-1 w-full skeleton rounded-full mb-3" />
                <div className="flex gap-1">
                  <div className="h-7 flex-1 skeleton rounded" />
                  <div className="h-7 flex-1 skeleton rounded" />
                </div>
              </div>
            </div>
          ))}

        {error && (
          <div className="col-span-full py-16 text-center">
            <p className="text-xs" style={{ color: "var(--red)" }}>Failed to load markets</p>
            <button
              className="mt-2 text-[11px] underline"
              style={{ color: "var(--fg-dim)" }}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {data && markets.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <p className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>No markets found</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--fg-dim)" }}>Try adjusting your search or filters</p>
          </div>
        )}

        {markets.map((market) => (
          <MarketCard key={market.id} market={market} onTrade={handleTrade} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <div
            className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--fg-dim)", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {data && !hasNextPage && markets.length > 0 && (
        <div className="py-3 text-center">
          <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>
            All {total} markets loaded
          </span>
        </div>
      )}

      {/* Trading Panel Slide-out */}
      {selectedTrade && selectedMarket && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-overlay)" }}
            onClick={() => setSelectedTrade(null)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm panel-enter"
            style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="h-full flex flex-col">
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>Trade</span>
                <button
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--fg-dim)" }}
                  onClick={() => setSelectedTrade(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <TradingPanel
                  marketId={selectedTrade.marketId}
                  yesPrice={selectedMarket.yesPrice}
                  noPrice={selectedMarket.noPrice}
                  initialSide={selectedTrade.side}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
