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
} from "lucide-react";
import type { MarketListItem } from "@/types";

interface MarketCardProps {
  market: MarketListItem;
  onTrade?: (marketId: string, side: "YES" | "NO") => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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

export function MarketCard({ market, onTrade }: MarketCardProps) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = 100 - yesPercent;
  const isResolved = market.status === "RESOLVED";
  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;
  const [imgError, setImgError] = useState(false);

  const CatIcon = CATEGORY_ICONS[market.category] ?? BarChart3;

  return (
    <div
      className="group border-b transition-colors"
      style={{ borderColor: "var(--border-light)" }}
    >
      <Link href={`/markets/${market.id}`} className="block">
        <div className="flex items-center gap-3 px-3 py-3 md:px-4">
          {/* Market Image / Category Icon */}
          {market.imageUrl && !imgError ? (
            <img
              src={market.imageUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-cover shrink-0"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: "var(--bg-surface)" }}
            >
              <CatIcon size={16} />
            </div>
          )}

          {/* Title + Meta Row */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2"
              style={{ color: "var(--fg)" }}
            >
              {market.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--fg-dim)" }}>
                {market.category.toLowerCase()}
              </span>
              {endsIn && !isResolved && (
                <>
                  <span className="text-[10px]" style={{ color: "var(--border)" }}>·</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: endsIn.urgent ? "var(--red)" : "var(--fg-dim)" }}>
                    <Clock size={10} />
                    {endsIn.label}
                  </span>
                </>
              )}
              <span className="text-[10px]" style={{ color: "var(--border)" }}>·</span>
              <span className="text-[10px] tabular-nums" style={{ color: "var(--fg-dim)" }}>
                ₱{formatVolume(market.volume)} vol
              </span>
            </div>
          </div>

          {/* Probability Bar + Buttons — compact */}
          <div className="flex items-center shrink-0 ml-2">
            {/* Thin probability bar (desktop only) */}
            <div className="hidden lg:flex flex-col items-end mr-3 min-w-[60px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--green)" }}>
                  {yesPercent}%
                </span>
                <span className="text-[10px]" style={{ color: "var(--fg-dim)" }}>·</span>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--red)" }}>
                  {noPercent}%
                </span>
              </div>
              <div
                className="w-full h-[3px] rounded-full overflow-hidden"
                style={{ background: "var(--red-dim)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${yesPercent}%`, background: "var(--green)" }}
                />
              </div>
            </div>

            {/* YES Button */}
            <button
              className="flex flex-col items-center px-2.5 py-1.5 md:px-3 md:py-2 rounded-l-lg border-r transition-all"
              style={{
                background: "var(--green-bg)",
                borderColor: "var(--border-light)",
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTrade?.(market.id, "YES");
              }}
            >
              <span
                className="text-[15px] md:text-base font-bold tabular-nums leading-none"
                style={{ color: "var(--green)" }}
              >
                {yesPercent}¢
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "var(--green)" }}>
                Yes
              </span>
            </button>

            {/* NO Button */}
            <button
              className="flex flex-col items-center px-2.5 py-1.5 md:px-3 md:py-2 rounded-r-lg transition-all"
              style={{ background: "var(--red-bg)" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTrade?.(market.id, "NO");
              }}
            >
              <span
                className="text-[15px] md:text-base font-bold tabular-nums leading-none"
                style={{ color: "var(--red)" }}
              >
                {noPercent}¢
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "var(--red)" }}>
                No
              </span>
            </button>
          </div>
        </div>
      </Link>
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
