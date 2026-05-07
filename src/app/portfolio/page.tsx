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
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <Wallet size={24} className="mx-auto mb-3" style={{ color: "var(--fg-dim)" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>Sign in to view your portfolio</p>
        <p className="text-xs mb-4" style={{ color: "var(--fg-dim)" }}>Track positions, P&L, and trading history</p>
        <button className="px-4 py-2 text-xs font-bold rounded" style={{ background: "var(--yellow)", color: "var(--bg)" }} onClick={openSignIn}>Sign In</button>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto py-3 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <div className="h-2 w-12 mb-2 skeleton rounded" />
              <div className="h-4 w-16 skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-3 py-2.5 skeleton" style={{ borderBottom: "1px solid var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-xs" style={{ color: "var(--red)" }}>Failed to load portfolio</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-[1200px] mx-auto py-3 px-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <SummaryCard label="Balance" value={`₱${data.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} icon={<Wallet size={11} />} />
        <SummaryCard
          label="Total P&L"
          value={`${data.totalPnl >= 0 ? "+" : ""}₱${Math.abs(data.totalPnl).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          color={data.totalPnl >= 0 ? "var(--green)" : "var(--red)"}
          icon={data.totalPnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        />
        <SummaryCard label="Positions" value={`₱${data.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} icon={<BarChart3 size={11} />} />
        <SummaryCard label="Invested" value={`₱${data.totalInvested.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
        <SummaryCard label="Markets" value={String(data.positions.length)} />
      </div>

      {/* Positions Table */}
      <div className="rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Positions</span>
          <span className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded" style={{ background: "var(--bg-surface)", color: "var(--fg-dim)" }}>{data.positions.length}</span>
        </div>

        {data.positions.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 size={24} className="mx-auto mb-2" style={{ color: "var(--fg-dim)" }} />
            <p className="text-xs font-medium mb-1" style={{ color: "var(--fg-muted)" }}>No open positions</p>
            <Link href="/markets" className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--yellow)" }}>
              Browse Markets <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_40px_60px_60px_70px_70px_50px] gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-dim)" }}>
              <span>Market</span>
              <span className="text-center">Side</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Avg</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
              <span />
            </div>

            {data.positions.map((pos) => {
              const pnlPercent = pos.totalCost > 0 ? (pos.unrealizedPnl / pos.totalCost) * 100 : 0;
              return (
                <div key={pos.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr_40px_60px_60px_70px_70px_50px] gap-1 px-3 py-2 items-center">
                    <Link href={`/markets/${pos.marketId}`} className="text-xs font-medium truncate hover:underline" style={{ color: "var(--fg)" }}>{pos.market.title}</Link>
                    <span className="text-center">
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: pos.side === "YES" ? "var(--green-dim)" : "var(--red-dim)", color: pos.side === "YES" ? "var(--green)" : "var(--red)" }}>{pos.side}</span>
                    </span>
                    <span className="text-xs tabular-nums text-right" style={{ color: "var(--fg)" }}>{pos.shares.toFixed(1)}</span>
                    <span className="text-xs tabular-nums text-right" style={{ color: "var(--fg-muted)" }}>₱{pos.avgPrice.toFixed(2)}</span>
                    <span className="text-xs tabular-nums text-right font-medium" style={{ color: "var(--fg)" }}>₱{pos.currentValue.toFixed(2)}</span>
                    <div className="text-right">
                      <div className="text-xs tabular-nums font-medium" style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}>{pos.unrealizedPnl >= 0 ? "+" : ""}₱{Math.abs(pos.unrealizedPnl).toFixed(2)}</div>
                      <div className="text-[9px] tabular-nums" style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}>{pos.unrealizedPnl >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%</div>
                    </div>
                    <Link href={`/markets/${pos.marketId}?action=sell&side=${pos.side}`} className="px-1.5 py-1 text-[9px] font-bold rounded text-center" style={{ background: "var(--red-dim)", color: "var(--red)" }}>Sell</Link>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-3 py-2">
                    <div className="flex items-start justify-between mb-1">
                      <Link href={`/markets/${pos.marketId}`} className="text-xs font-medium pr-2 truncate flex-1" style={{ color: "var(--fg)" }}>{pos.market.title}</Link>
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0" style={{ background: pos.side === "YES" ? "var(--green-dim)" : "var(--red-dim)", color: pos.side === "YES" ? "var(--green)" : "var(--red)" }}>{pos.side}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>{pos.shares.toFixed(1)} shares @ ₱{pos.avgPrice.toFixed(2)}</span>
                      <div className="text-right">
                        <span className="text-xs font-medium tabular-nums" style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}>{pos.unrealizedPnl >= 0 ? "+" : ""}₱{Math.abs(pos.unrealizedPnl).toFixed(2)}</span>
                        <span className="text-[9px] tabular-nums ml-1" style={{ color: pos.unrealizedPnl >= 0 ? "var(--green)" : "var(--red)" }}>({pnlPercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Activity */}
      <div className="mt-3">
        <ActivityFeed />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
        {icon} {label}
      </div>
      <div className="text-sm font-bold tabular-nums" style={{ color: color ?? "var(--fg)" }}>{value}</div>
    </div>
  );
}

function ActivityFeed() {
  const { data: activities, isLoading } = useActivity(10);
  return (
    <div className="rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Recent Activity</span>
      </div>
      {isLoading ? (
        <div>{[...Array(4)].map((_, i) => <div key={i} className="px-3 py-2 skeleton" style={{ borderBottom: "1px solid var(--border)" }} />)}</div>
      ) : !activities?.length ? (
        <div className="py-8 text-center"><p className="text-[10px]" style={{ color: "var(--fg-dim)" }}>No recent activity</p></div>
      ) : (
        <div>
          {activities.map((a) => {
            const configs: Record<string, { icon: React.ReactNode; color: string }> = {
              trade: { icon: <ArrowUpRight size={12} />, color: "var(--green)" },
              resolution: { icon: <CheckCircle2 size={12} />, color: "var(--yellow)" },
              deposit: { icon: <Plus size={12} />, color: "var(--green)" },
              withdrawal: { icon: <Minus size={12} />, color: "var(--red)" },
            };
            const cfg = configs[a.type] || configs.trade;
            const content = (
              <div className="flex items-center gap-2 px-3 py-2 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <p className="text-xs flex-1 truncate" style={{ color: "var(--fg)" }}>{a.message}</p>
                <span className="text-[9px] tabular-nums shrink-0" style={{ color: "var(--fg-dim)" }}>{getTimeAgo(a.createdAt)}</span>
              </div>
            );
            return a.marketId ? <Link key={a.id} href={`/markets/${a.marketId}`} className="block">{content}</Link> : <div key={a.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "now";
}
