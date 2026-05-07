"use client";

import { Trophy, TrendingUp, TrendingDown, Crown, Medal, Award } from "lucide-react";

// Mock data until leaderboard API is built
const MOCK_LEADERS = [
  { rank: 1, name: "TraderProPH", pnl: 45230, volume: 234000, winRate: 72, trades: 156 },
  { rank: 2, name: "ManilaBull", pnl: 38100, volume: 189000, winRate: 68, trades: 203 },
  { rank: 3, name: "CebuShark", pnl: 31450, volume: 156000, winRate: 65, trades: 134 },
  { rank: 4, name: "DavaoWhale", pnl: 28900, volume: 142000, winRate: 61, trades: 178 },
  { rank: 5, name: "QuezonKing", pnl: 22300, volume: 118000, winRate: 59, trades: 145 },
  { rank: 6, name: "MakatiPro", pnl: 19800, volume: 98000, winRate: 57, trades: 167 },
  { rank: 7, name: "BGCtrader", pnl: 17400, volume: 87000, winRate: 55, trades: 121 },
  { rank: 8, name: "PasigPlayer", pnl: 15200, volume: 76000, winRate: 54, trades: 98 },
  { rank: 9, name: "TaguigTiger", pnl: 12800, volume: 64000, winRate: 52, trades: 112 },
  { rank: 10, name: "MandaluyongM", pnl: 11500, volume: 58000, winRate: 51, trades: 89 },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={14} style={{ color: "#FBBF24" }} />;
  if (rank === 2) return <Medal size={14} style={{ color: "#94A3B8" }} />;
  if (rank === 3) return <Award size={14} style={{ color: "#D97706" }} />;
  return <span className="text-[10px] font-bold tabular-nums w-3.5 text-center" style={{ color: "var(--fg-dim)" }}>{rank}</span>;
}

export default function LeaderboardPage() {
  return (
    <div className="max-w-[1000px] mx-auto py-3 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} style={{ color: "var(--yellow)" }} />
        <h1 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Leaderboard</h1>
        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "var(--bg-surface)", color: "var(--fg-dim)" }}>Top Traders</span>
      </div>

      {/* Your rank placeholder */}
      <div className="p-3 rounded mb-3" style={{ background: "var(--yellow-subtle)", border: "1px solid var(--yellow-dim)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Your Rank</span>
            <span className="text-sm font-bold" style={{ color: "var(--yellow)" }}>—</span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>Start trading to appear on the leaderboard</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="grid grid-cols-[32px_1fr_80px_80px_60px_60px] gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-widest" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-dim)" }}>
          <span>#</span>
          <span>Trader</span>
          <span className="text-right">P/L</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Win %</span>
          <span className="text-right">Trades</span>
        </div>

        {MOCK_LEADERS.map((leader) => (
          <div
            key={leader.rank}
            className="grid grid-cols-[32px_1fr_80px_80px_60px_60px] gap-2 px-3 py-2 items-center transition-colors"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="flex items-center justify-center">{getRankIcon(leader.rank)}</span>
            <span className="text-xs font-medium" style={{ color: "var(--fg)" }}>{leader.name}</span>
            <span className="text-xs font-bold tabular-nums text-right" style={{ color: "var(--green)" }}>+₱{leader.pnl.toLocaleString()}</span>
            <span className="text-xs tabular-nums text-right" style={{ color: "var(--fg-muted)" }}>₱{(leader.volume / 1000).toFixed(0)}K</span>
            <span className="text-xs tabular-nums text-right" style={{ color: "var(--fg-muted)" }}>{leader.winRate}%</span>
            <span className="text-xs tabular-nums text-right" style={{ color: "var(--fg-dim)" }}>{leader.trades}</span>
          </div>
        ))}
      </div>

      <p className="text-[9px] mt-2 text-center" style={{ color: "var(--fg-dim)" }}>
        Leaderboard rankings are updated daily. Keep trading to improve your rank.
      </p>
    </div>
  );
}
