"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMarket } from "@/hooks/useMarket";
import { useMarketPrice } from "@/hooks/useMarketPrice";
import { TradingPanel } from "@/components/trading/trading-panel";
import { PriceChart } from "@/components/charts/price-chart";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Users,
  BarChart3,
  Activity,
  CheckCircle2,
} from "lucide-react";
import type { TradeAction } from "@/types";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { data: market, isLoading, error } = useMarket(id);

  useMarketPrice(id);

  const initialAction =
    (searchParams.get("action")?.toUpperCase() as TradeAction) || "BUY";
  const initialSide =
    (searchParams.get("side")?.toUpperCase() as "YES" | "NO") || "YES";

  if (isLoading) {
    return <MarketDetailSkeleton />;
  }

  if (error || !market) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <BarChart3 size={24} style={{ color: "var(--fg-dim)" }} />
        </div>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--fg)" }}>
          Market not found
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--fg-dim)" }}>
          This market may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/markets"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all"
          style={{ background: "var(--yellow)", color: "var(--fg)" }}
        >
          <ArrowLeft size={14} />
          Browse Markets
        </Link>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;
  const isResolved = market.status === "RESOLVED";

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "var(--fg-dim)" }}
        >
          <ArrowLeft size={12} />
          Markets
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Main Content */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Market Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
                style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}
              >
                {market.category}
              </span>

              {endsIn && !isResolved && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded"
                  style={{
                    background: endsIn.urgent ? "var(--red-dim)" : "var(--yellow-dim)",
                    color: endsIn.urgent ? "var(--red)" : "#D97706",
                  }}
                >
                  <Clock size={10} />
                  {endsIn.label}
                </span>
              )}

              {isResolved && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded"
                  style={{ background: "var(--green-dim)", color: "var(--green)" }}
                >
                  <CheckCircle2 size={10} />
                  Resolved: {market.outcome}
                </span>
              )}

              {market.resolutionSource && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded"
                  style={{ background: "var(--bg-surface)", color: "var(--fg-dim)" }}
                >
                  <ExternalLink size={10} />
                  {market.resolutionSource}
                </span>
              )}
            </div>

            <h1
              className="text-lg md:text-xl font-bold leading-tight mb-1.5"
              style={{ color: "var(--fg)" }}
            >
              {market.title}
            </h1>

            {market.description && (
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {market.description}
              </p>
            )}
          </div>

          {/* Price Chart */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <PriceChart marketId={market.id} currentYesPrice={market.yesPrice} />
          </div>

          {/* Price Display */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--fg-dim)" }}
              >
                Current Prices
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--fg-dim)" }}>
                {market.totalTrades} trades
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: "var(--green)" }}
                  >
                    {yesPercent}%
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: "var(--green)" }}>
                    Yes
                  </span>
                </div>
                <span className="text-[13px] tabular-nums" style={{ color: "var(--fg-muted)" }}>
                  ₱{market.yesPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-[13px] font-medium" style={{ color: "var(--red)" }}>
                    No
                  </span>
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: "var(--red)" }}
                  >
                    {100 - yesPercent}%
                  </span>
                </div>
                <span className="text-[13px] tabular-nums" style={{ color: "var(--fg-muted)" }}>
                  ₱{market.noPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Probability Bar */}
            <div
              className="h-2 rounded-full overflow-hidden"
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
              className="px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--fg-dim)" }}
              >
                Market Info
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4">
              <StatItem label="Volume" value={`₱${formatVolume(market.volume)}`} />
              <StatItem label="Liquidity" value={`₱${formatVolume(market.liquidity)}`} />
              <StatItem
                label="Positions"
                value={String(market._count?.positions ?? 0)}
                icon={<Users size={12} />}
              />
              <StatItem
                label="Trades"
                value={String(market._count?.trades ?? 0)}
                icon={<Activity size={12} />}
              />
            </div>

            {market.endsAt && (
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--border-light)" }}
              >
                <span className="text-[11px]" style={{ color: "var(--fg-dim)" }}>
                  {isResolved ? "Resolved" : "Ends"}
                </span>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: "var(--fg)" }}
                >
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
        <div className="lg:sticky lg:top-[60px] lg:self-start">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3
              className="text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--fg-dim)" }}
            >
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

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="px-4 py-3"
      style={{ borderRight: "1px solid var(--border-light)" }}
    >
      <div
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: "var(--fg-dim)" }}
      >
        {icon}
        {label}
      </div>
      <div className="text-[13px] font-bold tabular-nums" style={{ color: "var(--fg)" }}>
        {value}
      </div>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      <div className="mb-3">
        <div className="h-3 w-20 skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <div className="h-5 w-16 skeleton rounded" />
              <div className="h-5 w-20 skeleton rounded" />
            </div>
            <div className="h-7 w-3/4 mb-1.5 skeleton rounded" />
            <div className="h-3.5 w-full mb-1 skeleton rounded" />
            <div className="h-3.5 w-2/3 skeleton rounded" />
          </div>
          <div className="h-48 rounded-xl skeleton" />
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-16 skeleton rounded" />
              <div className="h-5 w-16 skeleton rounded" />
            </div>
            <div className="h-2 w-full skeleton rounded-full" />
          </div>
          <div
            className="rounded-xl"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="grid grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="h-3 w-12 mb-1.5 skeleton rounded" />
                  <div className="h-4 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-[60px] lg:self-start">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="h-3 w-12 mb-3 skeleton rounded" />
            <div className="h-10 w-full mb-2.5 skeleton rounded-lg" />
            <div className="h-10 w-full mb-2.5 skeleton rounded-lg" />
            <div className="h-10 w-full skeleton rounded-lg" />
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
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (days > 30)
    return { label: `${Math.floor(days / 30)}mo left`, urgent: false };
  if (days > 0) return { label: `${days}d left`, urgent: days <= 3 };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: "Ending soon", urgent: true };
}
