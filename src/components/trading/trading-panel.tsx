"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTradeQuote } from "@/hooks/useTradeQuote";
import { useExecuteTrade } from "@/hooks/useExecuteTrade";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useToast } from "@/contexts/toast-context";
import type { TradeAction } from "@/types";

interface TradingPanelProps {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  initialSide?: "YES" | "NO";
  initialAction?: TradeAction;
}

export function TradingPanel({ marketId, yesPrice, noPrice, initialSide = "YES", initialAction = "BUY" }: TradingPanelProps) {
  const [action, setAction] = useState<TradeAction>(initialAction);
  const [side, setSide] = useState<"YES" | "NO">(initialSide);
  const [amountInput, setAmountInput] = useState("100");
  const [debouncedAmount, setDebouncedAmount] = useState(100);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const latestAmountRef = useRef(100);
  const tradeMutation = useExecuteTrade();
  const { addToast } = useToast();
  const { data: portfolio } = usePortfolio();
  const balance = portfolio?.balance ?? 0;

  // Debounce amount input — 400ms delay
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseFloat(amountInput);
      if (!isNaN(parsed) && parsed > 0) {
        setDebouncedAmount(parsed);
        latestAmountRef.current = parsed;
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amountInput]);

  // Reset mutation state when trade inputs change
  useEffect(() => {
    tradeMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, side, debouncedAmount]);

  // Flush debounce immediately (for trade execution)
  const flushAmount = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const parsed = parseFloat(amountInput);
    if (!isNaN(parsed) && parsed > 0) {
      setDebouncedAmount(parsed);
      latestAmountRef.current = parsed;
    }
  }, [amountInput]);

  // Convert PHP amount to shares based on current price
  const currentPrice = side === "YES" ? yesPrice : noPrice;
  const shares = debouncedAmount / currentPrice;

  const quote = useTradeQuote({
    marketId,
    side,
    shares: shares,
    action,
  });

  const handleTrade = useCallback(() => {
    flushAmount();
    tradeMutation.mutate(
      {
        marketId,
        side,
        shares: latestAmountRef.current / currentPrice,
        action,
      },
      {
        onSuccess: (data) => {
          addToast(
            `${action === "BUY" ? "Bought" : "Sold"} ${side} shares successfully! Balance: ₱${data.newBalance.toFixed(2)}`,
            "success"
          );
        },
        onError: (error) => {
          addToast(error.message, "error");
        },
      }
    );
  }, [marketId, side, action, flushAmount, tradeMutation, currentPrice, addToast]);

  const potentialReturn = debouncedAmount / currentPrice;
  const impliedProbability = currentPrice * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Market Info */}
      <div
        className="p-3 rounded-xl"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--fg-dim)" }}>
            Implied Probability
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>
            {impliedProbability.toFixed(1)}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--red-dim)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${impliedProbability}%`,
              background: side === "YES" ? "var(--green)" : "var(--red)",
            }}
          />
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: "var(--bg-surface)" }}
      >
        {(["BUY", "SELL"] as const).map((a) => (
          <button
            key={a}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: action === a ? "var(--bg)" : "transparent",
              color: action === a
                ? a === "BUY"
                  ? "var(--green)"
                  : "var(--red)"
                : "var(--fg-dim)",
              boxShadow: action === a ? "var(--shadow-sm)" : "none",
            }}
            onClick={() => setAction(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {/* YES/NO Toggle */}
      <div className="flex gap-2">
        {(["YES", "NO"] as const).map((s) => (
          <button
            key={s}
            className="flex-1 py-3 text-sm font-bold rounded-xl transition-all"
            style={{
              background: side === s
                ? s === "YES"
                  ? "var(--green)"
                  : "var(--red)"
                : "var(--bg-surface)",
              color: side === s ? "white" : "var(--fg-muted)",
              boxShadow:
                side === s
                  ? s === "YES"
                    ? "0 4px 6px rgba(16, 185, 129, 0.3)"
                    : "0 4px 6px rgba(239, 68, 68, 0.3)"
                  : "none",
            }}
            onClick={() => setSide(s)}
          >
            <div>{s}</div>
            <div className="text-xs font-medium mt-0.5">
              ₱{(s === "YES" ? yesPrice : noPrice).toFixed(2)}
            </div>
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--fg-dim)" }}
        >
          AMOUNT (₱)
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: "var(--fg-dim)" }}
          >
            ₱
          </span>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            min="1"
            step="10"
            className="w-full pl-8 pr-4 py-3 text-lg font-bold tabular-nums rounded-xl outline-none transition-colors"
            style={{
              background: "var(--bg-surface)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
            placeholder="0"
          />
        </div>
        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mt-2">
          {[50, 100, 500, 1000].map((amount) => (
            <button
              key={amount}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
              onClick={() => setAmountInput(String(amount))}
            >
              ₱{amount}
            </button>
          ))}
          {balance > 0 && (
            <button
              className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors"
              style={{
                background: "var(--yellow-dim)",
                color: "#92400E",
                border: "1px solid var(--yellow)",
              }}
              onClick={() => setAmountInput(String(Math.floor(balance)))}
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Quote Summary */}
      {quote.data && debouncedAmount > 0 && (
        <div
          className="p-3 rounded-xl space-y-2"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--fg-dim)" }}>Shares</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>
              {shares.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--fg-dim)" }}>Price per share</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>
              ₱{currentPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--fg-dim)" }}>Fee (2%)</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>
              ₱{quote.data.fee.toFixed(2)}
            </span>
          </div>
          <div
            className="pt-2 flex justify-between text-sm font-semibold"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span style={{ color: "var(--fg-muted)" }}>Potential Return</span>
            <span className="tabular-nums" style={{ color: "var(--green)" }}>
              ₱{potentialReturn.toFixed(2)}
            </span>
          </div>

          {/* Price Impact Warning */}
          {quote.data.priceImpact > 0.02 && (
            <div
              className="flex items-center gap-1.5 text-[11px] font-medium pt-1"
              style={{ color: quote.data.priceImpact > 0.05 ? "var(--red)" : "#92400E" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              </svg>
              {quote.data.priceImpact > 0.05 ? "High" : "Moderate"} price impact: {(quote.data.priceImpact * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {quote.isLoading && debouncedAmount > 0 && (
        <div className="text-center py-2">
          <div className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--fg-dim)", borderTopColor: "transparent" }} />
        </div>
      )}

      {quote.error && (
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}
        >
          {quote.error.message}
        </div>
      )}

      {/* Execute Button */}
      <button
        className="w-full py-3.5 text-base font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: action === "BUY"
            ? side === "YES"
              ? "var(--green)"
              : "var(--red)"
            : side === "YES"
              ? "var(--red)"
              : "var(--green)",
          color: "white",
          boxShadow:
            action === "BUY"
              ? side === "YES"
                ? "0 4px 6px rgba(16, 185, 129, 0.3)"
                : "0 4px 6px rgba(239, 68, 68, 0.3)"
              : side === "YES"
                ? "0 4px 6px rgba(239, 68, 68, 0.3)"
                : "0 4px 6px rgba(16, 185, 129, 0.3)",
        }}
        onClick={handleTrade}
        disabled={tradeMutation.isPending || !debouncedAmount || debouncedAmount <= 0}
      >
        {tradeMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `${action} ${side} — ₱${debouncedAmount.toLocaleString()}`
        )}
      </button>
    </div>
  );
}
