"use client";

import Link from "next/link";
import { useState } from "react";
import type { MarketListItem } from "@/types";

interface MarketCardProps {
  market: MarketListItem;
  onTrade?: (marketId: string, side: "YES" | "NO") => void;
}

export function MarketCard({ market, onTrade }: MarketCardProps) {
  const yesPrice = market.yesPrice;
  const noPrice = market.noPrice;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);
  const isResolved = market.status === "RESOLVED";

  // Calculate time remaining
  const endsIn = market.endsAt ? getTimeRemaining(market.endsAt) : null;

  return (
    <div
      className="p-4 border-b transition-colors hover:bg-[var(--bg-hover)]"
      style={{ borderColor: "var(--border-light)" }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Market Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/markets/${market.id}`} className="block">
            <h3 className="text-base font-semibold leading-tight mb-2" style={{ color: "var(--fg)" }}>
              {market.title}
            </h3>
          </Link>

          {/* Probability Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--green)" }}>
                Yes {yesPercent}%
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--red)" }}>
                No {noPercent}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
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

          {/* Meta info */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
              style={{ background: "var(--bg-surface)", color: "var(--fg-muted)" }}
            >
              {market.category}
            </span>

            {endsIn && !isResolved && (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                style={{
                  background: endsIn.urgent ? "var(--red-dim)" : "var(--yellow-dim)",
                  color: endsIn.urgent ? "var(--red)" : "#92400E",
                }}
              >
                {endsIn.label}
              </span>
            )}

            <span className="text-xs tabular-nums" style={{ color: "var(--fg-dim)" }}>
              Vol: ₱{formatVolume(market.volume)}
            </span>

            {/* Share button */}
            <button
              className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(`${window.location.origin}/markets/${market.id}`);
              }}
              title="Share market"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{
              background: "var(--green)",
              color: "white",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
            }}
            onClick={() => onTrade?.(market.id, "YES")}
          >
            <span>Yes</span>
            <span className="tabular-nums">₱{yesPrice.toFixed(2)}</span>
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{
              background: "var(--red)",
              color: "white",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
            }}
            onClick={() => onTrade?.(market.id, "NO")}
          >
            <span>No</span>
            <span className="tabular-nums">₱{noPrice.toFixed(2)}</span>
          </button>
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
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 30) return { label: `${Math.floor(days / 30)}mo left`, urgent: false };
  if (days > 0) return { label: `${days}d left`, urgent: days <= 3 };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: "Ending soon", urgent: true };
}
