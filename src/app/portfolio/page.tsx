"use client";

import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useActivity } from "@/hooks/useActivity";

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const { openSignIn } = useAuthModal();
  const { data, isLoading, error } = usePortfolio();

  // Not authenticated
  if (!authLoading && !user) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--yellow-dim)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>
          Sign in to view your portfolio
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--fg-dim)" }}>
          Track your positions, P&L, and trading history
        </p>
        <button
          className="px-6 py-2.5 text-sm font-bold rounded-full transition-all hover:opacity-90"
          style={{ background: "var(--yellow)", color: "var(--fg)" }}
          onClick={openSignIn}
        >
          Sign In
        </button>
      </div>
    );
  }

  // Loading
  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4">
        {/* Summary skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
            >
              <div className="h-3 w-16 mb-2 skeleton rounded" />
              <div className="h-6 w-24 skeleton rounded" />
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b" style={{ borderColor: "var(--border-light)" }}>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 skeleton rounded" />
                <div className="h-5 w-12 skeleton rounded-full" />
                <div className="h-4 w-16 skeleton rounded" />
                <div className="h-4 w-16 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <p className="text-sm" style={{ color: "var(--red)" }}>
          Failed to load portfolio
        </p>
        <button
          className="mt-2 text-xs underline"
          style={{ color: "var(--fg-dim)" }}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--fg)" }}>
          Portfolio
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-dim)" }}>
          Your positions and performance
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Balance"
          value={`₱${data.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
        />
        <SummaryCard
          label="Total P&L"
          value={`${data.totalPnl >= 0 ? "+" : ""}₱${Math.abs(data.totalPnl).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          color={data.totalPnl >= 0 ? "var(--green)" : "var(--red)"}
        />
        <SummaryCard
          label="Positions Value"
          value={`₱${data.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
        />
        <SummaryCard
          label="Total Invested"
          value={`₱${data.totalInvested.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
        />
      </div>

      {/* Positions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>
            Positions
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded-full"
            style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}
          >
            {data.positions.length}
          </span>
        </div>

        {data.positions.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--bg-surface)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fg-dim)" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--fg-muted)" }}>
              No open positions
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--fg-dim)" }}>
              Start trading to build your portfolio
            </p>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all hover:opacity-90"
              style={{ background: "var(--yellow)", color: "var(--fg)" }}
            >
              Browse Markets
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header (desktop) */}
            <div
              className="hidden md:grid grid-cols-[1fr_60px_80px_80px_80px_80px] gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ borderBottom: "1px solid var(--border-light)", color: "var(--fg-dim)" }}
            >
              <span>Market</span>
              <span className="text-center">Side</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Avg Price</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
            </div>

            {data.positions.map((pos) => {
              const pnlPercent = pos.totalCost > 0
                ? ((pos.unrealizedPnl / pos.totalCost) * 100)
                : 0;

              return (
                <div
                  key={pos.id}
                  className="border-b transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-[1fr_60px_80px_80px_80px_80px_70px] gap-2 px-4 py-3 items-center">
                    <Link href={`/markets/${pos.marketId}`} className="text-sm truncate" style={{ color: "var(--fg)" }}>
                      {pos.market.title}
                    </Link>
                    <span className="text-center">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: pos.side === "YES" ? "var(--green-dim)" : "var(--red-dim)",
                          color: pos.side === "YES" ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {pos.side}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-right" style={{ color: "var(--fg)" }}>
                      {pos.shares.toFixed(1)}
                    </span>
                    <span className="text-sm tabular-nums text-right" style={{ color: "var(--fg-muted)" }}>
                      ₱{pos.avgPrice.toFixed(2)}
                    </span>
                    <span className="text-sm tabular-nums text-right font-medium" style={{ color: "var(--fg)" }}>
                      ₱{pos.currentValue.toFixed(2)}
                    </span>
                    <div className="text-right">
                      <div
                        className="text-sm tabular-nums font-medium"
                        style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}
                      >
                        {pos.unrealizedPnl >= 0 ? "+" : ""}₱{Math.abs(pos.unrealizedPnl).toFixed(2)}
                      </div>
                      <div
                        className="text-[10px] tabular-nums"
                        style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}
                      >
                        {pos.unrealizedPnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                    <Link
                      href={`/markets/${pos.marketId}?action=sell&side=${pos.side}`}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-lg text-center transition-all hover:opacity-90"
                      style={{ background: "var(--red)", color: "white" }}
                    >
                      Sell
                    </Link>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden px-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/markets/${pos.marketId}`} className="text-sm font-medium pr-4 truncate flex-1" style={{ color: "var(--fg)" }}>
                        {pos.market.title}
                      </Link>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: pos.side === "YES" ? "var(--green-dim)" : "var(--red-dim)",
                          color: pos.side === "YES" ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {pos.side}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
                          {pos.shares.toFixed(1)} shares @ ₱{pos.avgPrice.toFixed(2)}
                        </span>
                        <div className="mt-0.5">
                          <span
                            className="text-sm font-medium tabular-nums"
                            style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}
                          >
                            {pos.unrealizedPnl >= 0 ? "+" : ""}₱{Math.abs(pos.unrealizedPnl).toFixed(2)}
                          </span>
                          <span
                            className="text-[10px] tabular-nums ml-1"
                            style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}
                          >
                            ({pos.unrealizedPnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/markets/${pos.marketId}?action=sell&side=${pos.side}`}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all hover:opacity-90"
                        style={{ background: "var(--red)", color: "white" }}
                      >
                        Sell
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Activity Feed */}
      <div className="mt-6">
        <ActivityFeed />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--fg-dim)" }}>
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums" style={{ color: color ?? "var(--fg)" }}>
        {value}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const { data: activities, isLoading } = useActivity(15);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>
          Recent Activity
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full skeleton" />
              <div className="flex-1">
                <div className="h-3 w-3/4 mb-1 skeleton rounded" />
                <div className="h-2.5 w-1/3 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs" style={{ color: "var(--fg-dim)" }}>
            No recent activity
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity }: { activity: { type: string; message: string; createdAt: string; marketId: string | null } }) {
  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    trade: { icon: "↗", color: "var(--green)", bg: "var(--green-dim)" },
    resolution: { icon: "✓", color: "var(--yellow)", bg: "var(--yellow-dim)" },
    deposit: { icon: "+", color: "var(--green)", bg: "var(--green-dim)" },
    withdrawal: { icon: "−", color: "var(--red)", bg: "var(--red-dim)" },
  };

  const config = typeConfig[activity.type] || typeConfig.trade;
  const timeAgo = getTimeAgo(activity.createdAt);

  const content = (
    <div className="px-4 py-3 flex items-center gap-3 transition-colors hover:bg-[var(--bg-hover)]">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ background: config.bg, color: config.color }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: "var(--fg)" }}>
          {activity.message}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-dim)" }}>
          {timeAgo}
        </p>
      </div>
    </div>
  );

  if (activity.marketId) {
    return <Link href={`/markets/${activity.marketId}`} className="block">{content}</Link>;
  }

  return content;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
