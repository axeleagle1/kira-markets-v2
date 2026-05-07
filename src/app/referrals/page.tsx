"use client";

import { useState } from "react";
import { Users, Copy, CheckCircle2, Gift, TrendingUp, UserPlus } from "lucide-react";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "KIRA-XXXXXX"; // TODO: generate from user ID

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/markets?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[800px] mx-auto py-3 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} style={{ color: "var(--yellow)" }} />
        <h1 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Refer & Earn</h1>
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--fg-muted)" }}>
        Invite friends to Kira Markets. Earn ₱50 for every friend who signs up and makes their first trade.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
            <UserPlus size={10} /> Signups
          </div>
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>0</div>
        </div>
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
            <TrendingUp size={10} /> Active Traders
          </div>
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>0</div>
        </div>
        <div className="p-3 rounded" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
            <Gift size={10} /> Earnings
          </div>
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--green)" }}>₱0.00</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="p-3 rounded mb-4" style={{ background: "var(--yellow-subtle)", border: "1px solid var(--yellow-dim)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--fg-dim)" }}>Your Referral Link</div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-2.5 py-2 rounded text-xs font-mono truncate"
            style={{ background: "var(--bg-surface)", color: "var(--fg)", border: "1px solid var(--border)" }}
          >
            {window.location.origin}/markets?ref={referralCode}
          </div>
          <button
            className="px-3 py-2 rounded text-xs font-semibold transition-colors"
            style={{ background: "var(--yellow)", color: "var(--bg)" }}
            onClick={handleCopy}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>How It Works</span>
        </div>
        {[
          { step: "1", title: "Share your link", desc: "Send your unique referral link to friends" },
          { step: "2", title: "Friend signs up", desc: "They create an account using your link" },
          { step: "3", title: "Friend trades", desc: "When they complete their first trade, you earn" },
          { step: "4", title: "Get rewarded", desc: "₱50 credited to your balance instantly" },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "var(--yellow-dim)", color: "var(--yellow)" }}
            >
              {item.step}
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{item.title}</p>
              <p className="text-[10px]" style={{ color: "var(--fg-dim)" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending rewards */}
      <div className="mt-3 rounded overflow-hidden" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>Referral History</span>
        </div>
        <div className="py-8 text-center">
          <Users size={20} className="mx-auto mb-2" style={{ color: "var(--fg-dim)" }} />
          <p className="text-[10px]" style={{ color: "var(--fg-dim)" }}>No referrals yet. Share your link to start earning.</p>
        </div>
      </div>
    </div>
  );
}
