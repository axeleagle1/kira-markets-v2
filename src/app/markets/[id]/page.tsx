"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMarket } from "@/hooks/useMarket";
import { useMarketPrice } from "@/hooks/useMarketPrice";
import { TradingPanel } from "@/components/trading/trading-panel";
import { PriceChart } from "@/components/charts/price-chart";
import { ArrowLeft, Clock, ExternalLink, Users, Activity, CheckCircle2, BarChart3 } from "lucide-react";
import type { TradeAction } from "@/types";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { data: market, isLoading, error } = useMarket(id);
  useMarketPrice(id);

  const initialAction = (searchParams.get("action")?.toUpperCase() as TradeAction) || "BUY";
  const initialSide = (searchParams.get("side")?.toUpperCase() as "YES" | "NO") || "YES";

  if (isLoading) return <MarketDetailSkeleton />;
  if (error || !market) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center">
        <BarChart3 size={28} className="mx-auto mb-3" style={{ color: "var(--fg-dim)" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>Market not found</p>
        <p className="text-xs mb-3" style={{ color: "var(--fg-dim)" }}>This market may have been removed.</p>
        <Link href="/markets" className="text-xs font-medium" style={{ color: "var(--yellow)" }}>
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;
  const isResolved = market.status === "RESOLVED";

  return (
    <div className="max-w-[1200px] mx-auto py-3 px-4">
      <Link href="/markets" className="inline-flex items-center gap-1 text-[11px] font-medium mb-3" style={{ color: "var(--fg-dim)" }}>
        <ArrowLeft size={12} /> Markets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Main */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "var(--bg-surface)", color: "var(--fg-dim)" }}>
                {market.category}
              </span>
              {endsIn && !isResolved && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: endsIn.urgent ? "var(--red-dim)" : "var(--yellow-dim)", color: endsIn.urgent ? "var(--red)" : "var(--yellow)" }}>
                  <Clock size={9} /> {endsIn.label}
                </span>
              )}
              {isResolved && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
                  <CheckCircle2 size={9} /> Resolved: {market.outcome}
                </span>
              )}
            </div>
            <h1 className="text-base font-semibold leading-tight" style={{ color: "var(--fg)" }}>
              {market.title}
            </h1>
            {market.description && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                {market.description}
              </p>
            )}
          </div>

          {/* Chart */}
          <div className="rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <PriceChart marketId={market.id} currentYesPrice={market.yesPrice} />
          </div>

          {/* Prices */}
          <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Current Prices</span>
              <span className="text-[10px] tabular-nums" style={{ color: "var(--fg-dim)" }}>{market.totalTrades} trades</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold tabular-nums" style={{ color: "var(--green)" }}>{yesPercent}%</span>
                  <span className="text-xs font-medium" style={{ color: "var(--green)" }}>Yes</span>
                </div>
                <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>₱{market.yesPrice.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-xs font-medium" style={{ color: "var(--red)" }}>No</span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: "var(--red)" }}>{100 - yesPercent}%</span>
                </div>
                <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>₱{market.noPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${yesPercent}%`, background: "var(--green)" }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <StatItem label="Volume" value={`₱${formatVolume(market.volume)}`} />
            <StatItem label="Liquidity" value={`₱${formatVolume(market.liquidity)}`} />
            <StatItem label="Positions" value={String(market._count?.positions ?? 0)} />
            <StatItem label="Trades" value={String(market._count?.trades ?? 0)} />
          </div>

          {market.endsAt && (
            <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>{isResolved ? "Resolved" : "Ends"}</span>
              <span className="text-[10px] font-medium tabular-nums" style={{ color: "var(--fg)" }}>
                {new Date(market.endsAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>

        {/* Trading Panel */}
        <div className="lg:sticky lg:top-[56px] lg:self-start">
          <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <span className="text-[9px] font-bold uppercase tracking-widest mb-2.5 block" style={{ color: "var(--fg-dim)" }}>Trade</span>
            <TradingPanel marketId={market.id} yesPrice={market.yesPrice} noPrice={market.noPrice} initialAction={initialAction} initialSide={initialSide} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5" style={{ borderRight: "1px solid var(--border)" }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--fg-dim)" }}>{label}</div>
      <div className="text-xs font-bold tabular-nums" style={{ color: "var(--fg)" }}>{value}</div>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto py-3 px-4">
      <div className="h-3 w-16 mb-3 skeleton rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="flex flex-col gap-3">
          <div>
            <div className="h-4 w-3/4 mb-1 skeleton rounded" />
            <div className="h-3 w-full skeleton rounded" />
          </div>
          <div className="h-40 rounded skeleton" />
          <div className="h-16 rounded skeleton" />
          <div className="h-12 rounded skeleton" />
        </div>
        <div className="h-64 rounded skeleton" />
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
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { label: "Ended", urgent: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 30) return { label: `${Math.floor(days / 30)}mo left`, urgent: false };
  if (days > 0) return { label: `${days}d left`, urgent: days <= 3 };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: "Ending soon", urgent: true };
}
