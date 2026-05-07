"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTradeQuote } from "@/hooks/useTradeQuote";
import { useExecuteTrade } from "@/hooks/useExecuteTrade";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useToast } from "@/contexts/toast-context";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { TradeAction } from "@/types";

interface TradingPanelProps {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  initialSide?: "YES" | "NO";
  initialAction?: TradeAction;
}

export function TradingPanel({
  marketId,
  yesPrice,
  noPrice,
  initialSide = "YES",
  initialAction = "BUY",
}: TradingPanelProps) {
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

  useEffect(() => {
    tradeMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, side, debouncedAmount]);

  const flushAmount = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const parsed = parseFloat(amountInput);
    if (!isNaN(parsed) && parsed > 0) {
      setDebouncedAmount(parsed);
      latestAmountRef.current = parsed;
    }
  }, [amountInput]);

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
            `${action === "BUY" ? "Bought" : "Sold"} ${side} — Balance: ₱${data.newBalance.toFixed(2)}`,
            "success"
          );
        },
        onError: (error) => addToast(error.message, "error"),
      }
    );
  }, [marketId, side, action, flushAmount, tradeMutation, currentPrice, addToast]);

  const potentialReturn = debouncedAmount / currentPrice;
  const impliedProbability = currentPrice * 100;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Implied Probability */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--fg-dim)" }}>
          Implied Prob.
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--fg)" }}>
          {impliedProbability.toFixed(1)}%
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${impliedProbability}%`,
            background: side === "YES" ? "var(--green)" : "var(--red)",
          }}
        />
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex rounded p-0.5" style={{ background: "var(--bg-surface)" }}>
        {(["BUY", "SELL"] as const).map((a) => (
          <button
            key={a}
            className="flex-1 py-1.5 text-[11px] font-bold rounded transition-all"
            style={{
              background: action === a ? "var(--bg-raised)" : "transparent",
              color: action === a ? (a === "BUY" ? "var(--green)" : "var(--red)") : "var(--fg-dim)",
              boxShadow: action === a ? "var(--shadow-xs)" : "none",
            }}
            onClick={() => setAction(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {/* YES/NO */}
      <div className="flex gap-1">
        {(["YES", "NO"] as const).map((s) => (
          <button
            key={s}
            className="flex-1 py-2 text-xs font-bold rounded transition-all"
            style={{
              background: side === s
                ? s === "YES" ? "var(--green-dim)" : "var(--red-dim)"
                : "var(--bg-surface)",
              color: side === s
                ? s === "YES" ? "var(--green)" : "var(--red)"
                : "var(--fg-dim)",
              border: side === s
                ? `1px solid ${s === "YES" ? "var(--green)" : "var(--red)"}30`
                : "1px solid var(--border)",
            }}
            onClick={() => setSide(s)}
          >
            {s} ₱{(s === "YES" ? yesPrice : noPrice).toFixed(2)}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>
          Amount (₱)
        </label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "var(--fg-dim)" }}>₱</span>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            min="1"
            step="10"
            className="w-full pl-7 pr-3 py-2 text-sm font-bold tabular-nums rounded outline-none transition-colors"
            style={{
              background: "var(--bg-surface)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
            }}
            placeholder="0"
          />
        </div>
        <div className="flex gap-1 mt-1.5">
          {[50, 100, 500, 1000].map((amount) => (
            <button
              key={amount}
              className="flex-1 py-1 text-[10px] font-medium rounded transition-colors"
              style={{ background: "var(--bg-surface)", color: "var(--fg-dim)", border: "1px solid var(--border)" }}
              onClick={() => setAmountInput(String(amount))}
            >
              ₱{amount >= 1000 ? `${amount / 1000}K` : amount}
            </button>
          ))}
          {balance > 0 && (
            <button
              className="flex-1 py-1 text-[10px] font-bold rounded transition-colors"
              style={{ background: "var(--yellow-dim)", color: "var(--yellow)", border: "1px solid var(--yellow)30" }}
              onClick={() => setAmountInput(String(Math.floor(balance)))}
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Quote */}
      {quote.data && debouncedAmount > 0 && (
        <div className="p-2.5 rounded space-y-1" style={{ background: "var(--bg-surface)" }}>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: "var(--fg-dim)" }}>Shares</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>{shares.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: "var(--fg-dim)" }}>Price/share</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>₱{currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: "var(--fg-dim)" }}>Fee (2%)</span>
            <span className="font-medium tabular-nums" style={{ color: "var(--fg)" }}>₱{quote.data.fee.toFixed(2)}</span>
          </div>
          <div className="pt-1 flex justify-between text-[11px] font-semibold" style={{ borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "var(--fg-muted)" }}>Potential Return</span>
            <span className="tabular-nums" style={{ color: "var(--green)" }}>₱{potentialReturn.toFixed(2)}</span>
          </div>
          {quote.data.priceImpact > 0.02 && (
            <div className="flex items-center gap-1 text-[10px] font-medium pt-0.5" style={{ color: quote.data.priceImpact > 0.05 ? "var(--red)" : "var(--yellow)" }}>
              <AlertTriangle size={10} />
              {quote.data.priceImpact > 0.05 ? "High" : "Moderate"} impact: {(quote.data.priceImpact * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {quote.isLoading && debouncedAmount > 0 && (
        <div className="text-center py-1">
          <Loader2 size={14} className="animate-spin mx-auto" style={{ color: "var(--fg-dim)" }} />
        </div>
      )}

      {quote.error && (
        <div className="p-2 rounded text-[11px]" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
          {quote.error.message}
        </div>
      )}

      {/* Execute */}
      <button
        className="w-full py-2.5 text-xs font-bold rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: action === "BUY"
            ? side === "YES" ? "var(--green)" : "var(--red)"
            : side === "YES" ? "var(--red)" : "var(--green)",
          color: "var(--bg)",
        }}
        onClick={handleTrade}
        disabled={tradeMutation.isPending || !debouncedAmount || debouncedAmount <= 0}
      >
        {tradeMutation.isPending ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 size={14} className="animate-spin" />
            Processing...
          </span>
        ) : (
          `${action} ${side} — ₱${debouncedAmount.toLocaleString()}`
        )}
      </button>
    </div>
  );
}
