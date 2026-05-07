"use client";

import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useActivity } from "@/hooks/useActivity";
import {
  ArrowUpRight,
  CheckCircle2,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const { openSignIn } = useAuthModal();
  const { data, isLoading, error } = usePortfolio();

  if (!authLoading && !user) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--yellow-dim)" }}
        >
          <Wallet size={24} style={{ color: "var(--fg-muted)" }} />
        </div>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--fg)" }}>
          Sign in to view your portfolio
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--fg-dim)" }}>
          Track your positions, P&L, and trading history
        </p>
        <button
          className="px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all"
          style={{ background: "var(--yellow)", color: "var(--fg)" }}
          onClick={openSignIn}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-4 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="h-2.5 w-14 mb-2 skeleton rounded" />
              <div className="h-5 w-20 skeleton rounded" />
            </div>
          ))}
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--border-light)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3.5 skeleton rounded" />
                <div className="h-5 w-12 skeleton rounded" />
                <div className="h-3.5 w-14 skeleton rounded" />
                <div className="h-3.5 w-14 skeleton rounded" />
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
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
          Portfolio
        </h1>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <SummaryCard
          label="Balance"
          value={`₱${data.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          icon={<Wallet size={12} />}
        />
        <SummaryCard
          label="Total P&L"
          value={`${data.totalPnl >= 0 ? "+" : ""}₱${Math.abs(data.totalPnl).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          color={data.totalPnl >= 0 ? "var(--green)" : "var(--red)"}
          icon={data.totalPnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        />
        <SummaryCard
          label="Positions"
          value={`₱${data.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          icon={<BarChart3 size={12} />}
        />
        <SummaryCard
          label="Invested"
          value={`₱${data.totalInvested.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
        />
      </div>

      {/* Positions Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--fg-dim)" }}
          >
            Positions
          </span>
          <span
            className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}
          >
            {data.positions.length}
          </span>
        </div>

        {data.positions.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart3
              size={32}
              className="mx-auto mb-3"
              style={{ color: "var(--fg-dim)" }}
            />
            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--fg-muted)" }}>
              No open positions
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--fg-dim)" }}>
              Start trading to build your portfolio
            </p>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all"
              style={{ background: "var(--yellow)", color: "var(--fg)" }}
            >
              Browse Markets
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header (desktop) */}
            <div
              className="hidden md:grid grid-cols-[1fr_50px_70px_70px_80px_80px_60px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
              style={{
                borderBottom: "1px solid var(--border-light)",
                color: "var(--fg-dim)",
              }}
            >
              <span>Market</span>
              <span className="text-center">Side</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Avg</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
              <span />
            </div>

            {data.positions.map((pos) => {
              const pnlPercent =
                pos.totalCost > 0
                  ? (pos.unrealizedPnl / pos.totalCost) * 100
                  : 0;

              return (
                <div
                  key={pos.id}
                  className="border-b transition-colors"
                  style={{
                    borderColor: "var(--border-light)",
                  }}
                >
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr_50px_70px_70px_80px_80px_60px] gap-2 px-4 py-2.5 items-center">
                    <Link
                      href={`/markets/${pos.marketId}`}
                      className="text-[13px] font-medium truncate hover:underline"
                      style={{ color: "var(--fg)" }}
                    >
                      {pos.market.title}
                    </Link>
                    <span className="text-center">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            pos.side === "YES"
                              ? "var(--green-dim)"
                              : "var(--red-dim)",
                          color:
                            pos.side === "YES"
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        {pos.side}
                      </span>
                    </span>
                    <span
                      className="text-[13px] tabular-nums text-right"
                      style={{ color: "var(--fg)" }}
                    >
                      {pos.shares.toFixed(1)}
                    </span>
                    <span
                      className="text-[13px] tabular-nums text-right"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      ₱{pos.avgPrice.toFixed(2)}
                    </span>
                    <span
                      className="text-[13px] tabular-nums text-right font-medium"
                      style={{ color: "var(--fg)" }}
                    >
                      ₱{pos.currentValue.toFixed(2)}
                    </span>
                    <div className="text-right">
                      <div
                        className="text-[13px] tabular-nums font-medium"
                        style={{
                          color:
                            pos.unrealizedPnl >= 0
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        {pos.unrealizedPnl >= 0 ? "+" : ""}₱
                        {Math.abs(pos.unrealizedPnl).toFixed(2)}
                      </div>
                      <div
                        className="text-[10px] tabular-nums"
                        style={{
                          color:
                            pos.unrealizedPnl >= 0
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        {pos.unrealizedPnl >= 0 ? "+" : ""}
                        {pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                    <Link
                      href={`/markets/${pos.marketId}?action=sell&side=${pos.side}`}
                      className="px-2 py-1.5 text-[10px] font-bold rounded-md text-center transition-all"
                      style={{
                        background: "var(--red-dim)",
                        color: "var(--red)",
                      }}
                    >
                      Sell
                    </Link>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <Link
                        href={`/markets/${pos.marketId}`}
                        className="text-[13px] font-medium pr-3 truncate flex-1"
                        style={{ color: "var(--fg)" }}
                      >
                        {pos.market.title}
                      </Link>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background:
                            pos.side === "YES"
                              ? "var(--green-dim)"
                              : "var(--red-dim)",
                          color:
                            pos.side === "YES"
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      >
                        {pos.side}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
                          {pos.shares.toFixed(1)} shares @ ₱
                          {pos.avgPrice.toFixed(2)}
                        </span>
                        <div className="mt-0.5">
                          <span
                            className="text-[13px] font-medium tabular-nums"
                            style={{
                              color:
                                pos.unrealizedPnl >= 0
                                  ? "var(--green)"
                                  : "var(--red)",
                            }}
                          >
                            {pos.unrealizedPnl >= 0 ? "+" : ""}₱
                            {Math.abs(pos.unrealizedPnl).toFixed(2)}
                          </span>
                          <span
                            className="text-[10px] tabular-nums ml-1"
                            style={{
                              color:
                                pos.unrealizedPnl >= 0
                                  ? "var(--green)"
                                  : "var(--red)",
                            }}
                          >
                            ({pos.unrealizedPnl >= 0 ? "+" : ""}
                            {pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/markets/${pos.marketId}?action=sell&side=${pos.side}`}
                        className="px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all"
                        style={{
                          background: "var(--red-dim)",
                          color: "var(--red)",
                        }}
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
      <div className="mt-5">
        <ActivityFeed />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="p-3.5 rounded-xl"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--fg-dim)" }}
      >
        {icon}
        {label}
      </div>
      <div
        className="text-base font-bold tabular-nums"
        style={{ color: color ?? "var(--fg)" }}
      >
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
        className="px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--fg-dim)" }}
        >
          Recent Activity
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full skeleton" />
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

function ActivityRow({
  activity,
}: {
  activity: {
    type: string;
    message: string;
    createdAt: string;
    marketId: string | null;
  };
}) {
  const typeConfig: Record<
    string,
    { icon: React.ReactNode; color: string; bg: string }
  > = {
    trade: {
      icon: <ArrowUpRight size={14} />,
      color: "var(--green)",
      bg: "var(--green-dim)",
    },
    resolution: {
      icon: <CheckCircle2 size={14} />,
      color: "var(--yellow)",
      bg: "var(--yellow-dim)",
    },
    deposit: {
      icon: <Plus size={14} />,
      color: "var(--green)",
      bg: "var(--green-dim)",
    },
    withdrawal: {
      icon: <Minus size={14} />,
      color: "var(--red)",
      bg: "var(--red-dim)",
    },
  };

  const config = typeConfig[activity.type] || typeConfig.trade;
  const timeAgo = getTimeAgo(activity.createdAt);

  const content = (
    <div className="px-4 py-2.5 flex items-center gap-3 transition-colors">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: config.bg, color: config.color }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] truncate" style={{ color: "var(--fg)" }}>
          {activity.message}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-dim)" }}>
          {timeAgo}
        </p>
      </div>
    </div>
  );

  if (activity.marketId) {
    return (
      <Link href={`/markets/${activity.marketId}`} className="block">
        {content}
      </Link>
    );
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
