"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMarket } from "@/hooks/useMarket";
import { useMarketPrice } from "@/hooks/useMarketPrice";
import { TradingPanel } from "@/components/trading/trading-panel";
import { PriceChart } from "@/components/charts/price-chart";
import type { TradeAction } from "@/types";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { data: market, isLoading, error } = useMarket(id);

  // Subscribe to real-time price updates
  useMarketPrice(id);

  const initialAction = (searchParams.get("action")?.toUpperCase() as TradeAction) || "BUY";
  const initialSide = (searchParams.get("side")?.toUpperCase() as "YES" | "NO") || "YES";

  if (isLoading) {
    return <MarketDetailSkeleton />;
  }

  if (error || !market) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fg-dim)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>
          Market not found
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--fg-dim)" }}>
          This market may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all hover:opacity-90"
          style={{ background: "var(--yellow)", color: "var(--fg)" }}
        >
          Browse Markets
        </Link>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;
  const isResolved = market.status === "RESOLVED";

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/markets"
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--fg-dim)" }}
        >
          ← Back to Markets
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Main Content */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Market Header */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}
              >
                {market.category}
              </span>

              {endsIn && !isResolved && (
                <span
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                  style={{
                    background: endsIn.urgent ? "var(--red-dim)" : "var(--yellow-dim)",
                    color: endsIn.urgent ? "var(--red)" : "#92400E",
                  }}
                >
                  {endsIn.label}
                </span>
              )}

              {isResolved && (
                <span
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                  style={{ background: "var(--green-dim)", color: "var(--green)" }}
                >
                  Resolved: {market.outcome}
                </span>
              )}

              {market.resolutionSource && (
                <span
                  className="px-2.5 py-1 text-[10px] font-medium rounded-full"
                  style={{ background: "var(--bg-surface)", color: "var(--fg-dim)" }}
                >
                  Source: {market.resolutionSource}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: "var(--fg)" }}>
              {market.title}
            </h1>

            {market.description && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {market.description}
              </p>
            )}
          </div>

          {/* Price Chart */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <PriceChart marketId={market.id} currentYesPrice={market.yesPrice} />
          </div>

          {/* Price Display */}
          <div
            className="p-5 rounded-xl"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>
                Current Prices
              </span>
              <span className="text-xs tabular-nums" style={{ color: "var(--fg-dim)" }}>
                {market.totalTrades} trades
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--green)" }}>
                    {yesPercent}%
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--green)" }}>
                    Yes
                  </span>
                </div>
                <span className="text-sm tabular-nums" style={{ color: "var(--fg-muted)" }}>
                  ₱{market.yesPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-sm font-medium" style={{ color: "var(--red)" }}>
                    No
                  </span>
                  <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--red)" }}>
                    {100 - yesPercent}%
                  </span>
                </div>
                <span className="text-sm tabular-nums" style={{ color: "var(--fg-muted)" }}>
                  ₱{market.noPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Probability Bar */}
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: "var(--red-dim)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${yesPercent}%`,
                  background: "var(--green)",
                }}
              />
            </div>
          </div>

          {/* Market Stats */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>
                Market Info
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4">
              <StatItem label="Volume" value={`₱${formatVolume(market.volume)}`} />
              <StatItem label="Liquidity" value={`₱${formatVolume(market.liquidity)}`} />
              <StatItem label="Positions" value={String(market._count?.positions ?? 0)} />
              <StatItem label="Trades" value={String(market._count?.trades ?? 0)} />
            </div>

            {market.endsAt && (
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--border-light)" }}
              >
                <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
                  {isResolved ? "Resolved" : "Ends"}
                </span>
                <span className="text-xs font-medium tabular-nums" style={{ color: "var(--fg)" }}>
                  {new Date(market.endsAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel (sidebar on desktop) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>
              Trade
            </h3>
            <TradingPanel
              marketId={market.id}
              yesPrice={market.yesPrice}
              noPrice={market.noPrice}
              initialAction={initialAction}
              initialSide={initialSide}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-5 py-3.5"
      style={{ borderRight: "1px solid var(--border-light)" }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-dim)" }}>
        {label}
      </div>
      <div className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>
        {value}
      </div>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-4">
        <div className="h-3 w-24 skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="flex flex-col gap-5">
          {/* Header skeleton */}
          <div>
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-16 skeleton rounded-full" />
              <div className="h-5 w-20 skeleton rounded-full" />
            </div>
            <div className="h-8 w-3/4 mb-2 skeleton rounded" />
            <div className="h-4 w-full mb-1 skeleton rounded" />
            <div className="h-4 w-2/3 skeleton rounded" />
          </div>
          {/* Chart skeleton */}
          <div className="h-48 rounded-xl skeleton" />
          {/* Price skeleton */}
          <div
            className="p-5 rounded-xl"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-16 skeleton rounded" />
              <div className="h-6 w-16 skeleton rounded" />
            </div>
            <div className="h-3 w-full skeleton rounded-full" />
          </div>
          {/* Stats skeleton */}
          <div
            className="rounded-xl"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <div className="grid grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="h-3 w-12 mb-2 skeleton rounded" />
                  <div className="h-5 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Trading panel skeleton */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
          >
            <div className="h-4 w-12 mb-4 skeleton rounded" />
            <div className="h-10 w-full mb-3 skeleton rounded-xl" />
            <div className="h-10 w-full mb-3 skeleton rounded-xl" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(0);
}

function getTimeRemaining(endsAt: string): { label: string; urgent: boolean } {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return { label: "Ended", urgent: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 30) return { label: `${Math.floor(days / 30)}mo left`, urgent: false };
  if (days > 0) return { label: `${days}d left`, urgent: days <= 3 };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: "Ending soon", urgent: true };
}
