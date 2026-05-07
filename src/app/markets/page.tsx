"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useMarketsPriceUpdates } from "@/hooks/useMarketPrice";
import { MarketCard } from "@/components/trading/market-card";
import { TradingPanel } from "@/components/trading/trading-panel";
import {
  Landmark,
  Trophy,
  Bitcoin,
  Film,
  TrendingUp,
  FlaskConical,
  Cpu,
  CloudSun,
  BarChart3,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const CATEGORIES = [
  { id: "All", label: "All Markets", icon: LayoutGrid },
  { id: "Politics", label: "Politics", icon: Landmark },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Crypto", label: "Crypto", icon: Bitcoin },
  { id: "Entertainment", label: "Entertainment", icon: Film },
  { id: "Economics", label: "Economics", icon: TrendingUp },
  { id: "Science", label: "Science", icon: FlaskConical },
  { id: "Technology", label: "Technology", icon: Cpu },
  { id: "Weather", label: "Weather", icon: CloudSun },
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
      category: category === "All" ? undefined : category,
      search: debouncedSearch || undefined,
      sort,
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
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex gap-5">
        {/* ─── Sidebar — desktop only ─── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-[60px]">
            <h3
              className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2"
              style={{ color: "var(--fg-dim)" }}
            >
              Categories
            </h3>
            <nav className="flex flex-col">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded-md transition-colors text-left"
                    style={{
                      color: active ? "var(--fg)" : "var(--fg-muted)",
                      background: active ? "var(--bg-surface)" : "transparent",
                      borderLeft: active ? "2px solid var(--yellow)" : "2px solid transparent",
                    }}
                    onClick={() => setCategory(cat.id)}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                    {cat.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0">
          {/* Search + Sort Bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2.5">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--fg-dim)" }}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full pl-9 pr-8 py-2 text-[13px] rounded-lg outline-none transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                />
                {searchInput && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                    style={{ color: "var(--fg-dim)" }}
                    onClick={() => setSearchInput("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Category Selector */}
              <select
                className="lg:hidden px-2.5 py-2 text-[13px] rounded-lg outline-none appearance-none"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                  minWidth: 110,
                }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Pills */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <SlidersHorizontal size={12} style={{ color: "var(--fg-dim)" }} className="mr-1" />
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    className="px-2 py-1 text-[11px] font-medium rounded-md transition-colors"
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
              {data && (
                <span className="text-[11px] tabular-nums font-medium" style={{ color: "var(--fg-dim)" }}>
                  {total} results
                </span>
              )}
            </div>
          </div>

          {/* Market List Container */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {isLoading && (
              <div>
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <div className="w-9 h-9 rounded-lg skeleton shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3 w-3/4 mb-1.5 skeleton rounded" />
                      <div className="h-2.5 w-1/3 skeleton rounded" />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-12 h-11 skeleton rounded-l-lg" />
                      <div className="w-12 h-11 skeleton rounded-r-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  Failed to load markets
                </p>
                <button
                  className="mt-2 text-xs underline"
                  style={{ color: "var(--fg-dim)" }}
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            )}

            {data && markets.length === 0 && (
              <div className="py-16 text-center">
                <BarChart3 size={40} style={{ color: "var(--fg-dim)" }} className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
                  No markets found
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--fg-dim)" }}>
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {markets.map((market) => (
              <MarketCard key={market.id} market={market} onTrade={handleTrade} />
            ))}

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="p-4 text-center">
                <div
                  className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: "var(--fg-dim)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}

            {data && !hasNextPage && markets.length > 0 && (
              <div className="p-3 text-center">
                <span className="text-[11px]" style={{ color: "var(--fg-dim)" }}>
                  All {total} markets loaded
                </span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Trading Panel Slide-out */}
      {selectedTrade && selectedMarket && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-overlay)" }}
            onClick={() => setSelectedTrade(null)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md panel-enter"
            style={{
              background: "var(--bg)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="h-full flex flex-col">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  Trade
                </h3>
                <button
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                  onClick={() => setSelectedTrade(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
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
