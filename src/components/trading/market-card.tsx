"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Landmark,
  Trophy,
  Bitcoin,
  Film,
  TrendingUp,
  FlaskConical,
  Cpu,
  CloudSun,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";
import type { MarketListItem } from "@/types";

interface MarketCardProps {
  market: MarketListItem;
  onTrade?: (marketId: string, side: "YES" | "NO") => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  POLITICS: Landmark,
  SPORTS: Trophy,
  CRYPTO: Bitcoin,
  ENTERTAINMENT: Film,
  ECONOMICS: TrendingUp,
  SCIENCE: FlaskConical,
  TECHNOLOGY: Cpu,
  WEATHER: CloudSun,
  OTHER: BarChart3,
};

function getBadge(market: MarketListItem): { label: string; color: string } | null {
  if (market.status === "RESOLVED") return { label: "RESOLVED", color: "var(--fg-dim)" };
  if (market.endsAt) {
    const diff = new Date(market.endsAt).getTime() - Date.now();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 0) return { label: "ENDED", color: "var(--fg-dim)" };
    if (hours < 24) return { label: "ENDING SOON", color: "var(--red)" };
  }
  if (market.volume > 5_000_000) return { label: "HOT", color: "var(--yellow)" };
  if (market.totalTrades > 100) return { label: "TRENDING", color: "var(--green)" };
  return null;
}

export function MarketCard({ market, onTrade }: MarketCardProps) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = 100 - yesPercent;
  const [imgError, setImgError] = useState(false);
  const CatIcon = CATEGORY_ICONS[market.category] ?? BarChart3;
  const badge = getBadge(market);

  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;

  return (
    <div
      className="flex flex-col transition-colors"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <Link href={`/markets/${market.id}`} className="flex flex-col flex-1">
        {/* Top: icon + category + badge */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
          <div className="flex items-center gap-1.5">
            {market.imageUrl && !imgError ? (
              <img
                src={market.imageUrl}
                alt=""
                className="w-5 h-5 rounded object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <CatIcon size={14} strokeWidth={1.6} />
            )}
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>
              {market.category.toLowerCase()}
            </span>
          </div>
          {badge && (
            <span
              className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: `${badge.color}15`, color: badge.color }}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="px-3 pt-1.5 pb-2 flex-1">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "var(--fg)" }}
          >
            {market.title}
          </h3>
        </div>

        {/* Probability bar */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--green)" }}>
              {yesPercent}% YES
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--red)" }}>
              {noPercent}% NO
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "var(--bg-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${yesPercent}%`, background: "var(--green)" }}
            />
          </div>
        </div>
      </Link>

      {/* YES/NO Buttons */}
      <div className="flex gap-1 px-3 pb-2.5">
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--green-dim)", color: "var(--green)" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTrade?.(market.id, "YES");
          }}
        >
          Yes ₱{market.yesPrice.toFixed(2)}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTrade?.(market.id, "NO");
          }}
        >
          No ₱{market.noPrice.toFixed(2)}
        </button>
      </div>

      {/* Metadata row */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider tabular-nums" style={{ color: "var(--fg-dim)" }}>
          ₱{formatVolume(market.volume)} vol
        </span>
        {endsIn && (
          <span
            className="flex items-center gap-0.5 text-[9px] font-medium"
            style={{ color: endsIn.urgent ? "var(--red)" : "var(--fg-dim)" }}
          >
            <Clock size={9} />
            {endsIn.label}
          </span>
        )}
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

  if (days > 30) return { label: `${Math.floor(days / 30)}mo`, urgent: false };
  if (days > 0) return { label: `${days}d`, urgent: days <= 3 };
  if (hours > 0) return { label: `${hours}h`, urgent: true };
  return { label: "soon", urgent: true };
}
