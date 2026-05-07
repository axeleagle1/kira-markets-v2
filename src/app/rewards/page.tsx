"use client";

import { Gift, Star, Zap, Lock, CheckCircle2 } from "lucide-react";

const REWARD_TIERS = [
  { name: "Bronze", trades: 10, reward: "₱100 Bonus", icon: "🥉", unlocked: false },
  { name: "Silver", trades: 50, reward: "₱500 Bonus", icon: "🥈", unlocked: false },
  { name: "Gold", trades: 100, reward: "₱1,000 Bonus", icon: "🥇", unlocked: false },
  { name: "Platinum", trades: 500, reward: "₱5,000 Bonus", icon: "💎", unlocked: false },
  { name: "Diamond", trades: 1000, reward: "₱10,000 Bonus", icon: "👑", unlocked: false },
];

export default function RewardsPage() {
  return (
    <div className="max-w-[800px] mx-auto py-3 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={16} style={{ color: "var(--yellow)" }} />
        <h1 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Rewards</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>Total Earned</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--green)" }}>₱0.00</div>
        </div>
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>Current Tier</div>
          <div className="text-sm font-bold" style={{ color: "var(--fg-dim)" }}>None</div>
        </div>
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>Total Trades</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>0</div>
        </div>
      </div>

      {/* Tiers */}
      <div className="rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Trading Milestones</span>
        </div>
        {REWARD_TIERS.map((tier) => (
          <div
            key={tier.name}
            className="flex items-center gap-3 px-3 py-3 transition-colors"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-lg">{tier.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{tier.name}</span>
                {tier.unlocked && <CheckCircle2 size={12} style={{ color: "var(--green)" }} />}
              </div>
              <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>{tier.trades} trades to unlock</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold" style={{ color: tier.unlocked ? "var(--green)" : "var(--fg-muted)" }}>{tier.reward}</div>
              {!tier.unlocked && (
                <div className="flex items-center gap-0.5 justify-end text-[9px]" style={{ color: "var(--fg-dim)" }}>
                  <Lock size={9} /> Locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] mt-2 text-center" style={{ color: "var(--fg-dim)" }}>
        Rewards are credited automatically when milestones are reached.
      </p>
    </div>
  );
}
