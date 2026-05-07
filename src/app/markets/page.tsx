"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useMarketsPriceUpdates } from "@/hooks/useMarketPrice";
import { MarketCard } from "@/components/trading/market-card";
import { TradingPanel } from "@/components/trading/trading-panel";

const CATEGORIES = [
  { id: "All", label: "All Markets", icon: "📊" },
  { id: "Politics", label: "Politics", icon: "🏛️" },
  { id: "Sports", label: "Sports", icon: "⚽" },
  { id: "Crypto", label: "Crypto", icon: "₿" },
  { id: "Entertainment", label: "Pop Culture", icon: "🎬" },
  { id: "Economics", label: "Economy", icon: "📈" },
  { id: "Science", label: "Science", icon: "🔬" },
  { id: "Technology", label: "Tech", icon: "💻" },
  { id: "Weather", label: "Weather", icon: "🌤️" },
];

const SORTS = [
  { value: "volume", label: "Most Volume" },
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

  // Debounce search input — 300ms
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

  // Subscribe to real-time price updates for visible markets
  const marketIds = useMemo(() => markets.map((m) => m.id), [markets]);
  useMarketsPriceUpdates(marketIds);

  const handleTrade = (marketId: string, side: "YES" | "NO") => {
    setSelectedTrade({ marketId, side });
  };

  const selectedMarket = markets.find((m) => m.id === selectedTrade?.marketId);

  // Infinite scroll sentinel
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Left Sidebar - Categories */}
        <aside className="hidden md:block w-48 shrink-0">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-dim)" }}>
              Categories
            </h3>
            <nav className="flex flex-col gap-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left"
                  style={{
                    color: category === cat.id ? "var(--fg)" : "var(--fg-muted)",
                    background: category === cat.id ? "var(--yellow-dim)" : "transparent",
                  }}
                  onClick={() => setCategory(cat.id)}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </nav>

            {/* Sync Button */}
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--fg-muted)",
                  border: "1px solid var(--border)",
                }}
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Markets
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - Market Feed */}
        <main className="flex-1 min-w-0">
          {/* Search and Sort */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--fg)",
                    border: "1px solid var(--border)",
                  }}
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--fg-dim)"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>

              {/* Mobile Category Selector */}
              <select
                className="md:hidden px-3 py-2.5 text-sm rounded-xl outline-none"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    color: sort === s.value ? "var(--fg)" : "var(--fg-dim)",
                    background: sort === s.value ? "var(--bg-surface)" : "transparent",
                  }}
                  onClick={() => setSort(s.value)}
                >
                  {s.label}
                </button>
              ))}
              <div className="flex-1" />
              {data && (
                <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
                  {total} markets
                </span>
              )}
            </div>
          </div>

          {/* Market Cards */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            {isLoading && (
              <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="h-5 w-3/4 mb-2 skeleton" />
                        <div className="h-1.5 w-full mb-2 skeleton rounded-full" />
                        <div className="flex gap-2">
                          <div className="h-5 w-16 skeleton rounded-full" />
                          <div className="h-5 w-20 skeleton rounded-full" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 w-20 skeleton rounded-xl" />
                        <div className="h-10 w-20 skeleton rounded-xl" />
                      </div>
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
                <p className="text-4xl mb-2">📊</p>
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="p-4 text-center">
                <div
                  className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--fg-dim)", borderTopColor: "transparent" }}
                />
              </div>
            )}

            {data && !hasNextPage && markets.length > 0 && (
              <div className="p-4 text-center">
                <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
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
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-overlay)" }}
            onClick={() => setSelectedTrade(null)}
          />

          {/* Panel */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md panel-enter"
            style={{
              background: "var(--bg)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  Trade
                </h3>
                <button
                  className="p-1 rounded-lg hover:bg-[var(--bg-hover)]"
                  onClick={() => setSelectedTrade(null)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Trading Panel */}
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
