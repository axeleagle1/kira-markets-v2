"use client";

import { useMemo } from "react";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface PriceChartProps {
  marketId: string;
  currentYesPrice: number;
}

export function PriceChart({ marketId, currentYesPrice }: PriceChartProps) {
  const { data: history, isLoading } = usePriceHistory(marketId);

  const points = useMemo(() => {
    if (!history || history.length === 0) return null;
    // Take last 100 points for the chart
    const data = history.slice(-100);
    const w = 100;
    const h = 40;
    const minP = Math.min(...data.map((d) => d.yesPrice));
    const maxP = Math.max(...data.map((d) => d.yesPrice));
    const range = maxP - minP || 0.01;

    const pathParts: string[] = [];
    const fillParts: string[] = [];

    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.yesPrice - minP) / range) * h;
      if (i === 0) {
        pathParts.push(`M ${x} ${y}`);
        fillParts.push(`M ${x} ${h} L ${x} ${y}`);
      } else {
        pathParts.push(`L ${x} ${y}`);
        fillParts.push(`L ${x} ${y}`);
      }
    });

    fillParts.push(`L ${w} ${h} Z`);

    return {
      line: pathParts.join(" "),
      fill: fillParts.join(" "),
      lastY: h - ((data[data.length - 1].yesPrice - minP) / range) * h,
      lastPrice: data[data.length - 1].yesPrice,
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 rounded"
        style={{ background: "var(--bg-raised)" }}>
        <span className="text-xs" style={{ color: "var(--fg-dim)" }}>Loading chart...</span>
      </div>
    );
  }

  if (!points) {
    return (
      <div className="flex items-center justify-center h-40 rounded"
        style={{ background: "var(--bg-raised)" }}>
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--green)" }}>
            {(currentYesPrice * 100).toFixed(1)}¢
          </div>
          <div className="text-[10px] mt-1" style={{ color: "var(--fg-dim)" }}>
            No price history yet
          </div>
        </div>
      </div>
    );
  }

  const isUp = points.lastPrice >= (history?.[0]?.yesPrice ?? 0.5);
  const lineColor = isUp ? "var(--green)" : "var(--red)";
  const fillColor = isUp ? "var(--green-dim)" : "var(--red-dim)";

  return (
    <div className="relative rounded overflow-hidden" style={{ background: "var(--bg-raised)" }}>
      <svg
        viewBox={`0 0 100 40`}
        className="w-full h-40"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d={points.fill} fill="url(#chartFill)" />
        <path d={points.line} fill="none" stroke={lineColor} strokeWidth="0.5" />
        {/* Current price dot */}
        <circle
          cx="100"
          cy={points.lastY}
          r="1.2"
          fill={lineColor}
        />
      </svg>
      {/* Price label overlay */}
      <div className="absolute top-2 left-3">
        <div className="text-xl font-bold tabular-nums" style={{ color: lineColor }}>
          {(currentYesPrice * 100).toFixed(1)}¢
        </div>
        <div className="text-[10px]" style={{ color: "var(--fg-dim)" }}>
          YES price
        </div>
      </div>
    </div>
  );
}
