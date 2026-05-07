/**
 * Logarithmic Market Scoring Rule (LMSR) — Automated Market Maker
 *
 * Numerically stabilized implementation using the log-sum-exp trick.
 *
 * Cost function:  C(q) = b * ln(exp(q_yes/b) + exp(q_no/b))
 * Price:          p_yes = exp(q_yes/b) / (exp(q_yes/b) + exp(q_no/b))
 *
 * The log-sum-exp stabilization prevents overflow when share quantities
 * grow large relative to the liquidity parameter b.
 */

import { Decimal } from "@prisma/client/runtime/library";

// ─── Constants ─────────────────────────────────────────

export const FEE_RATE = 0.02;
const MAX_SHARES_PER_TRADE = 100_000;

// ─── Types ─────────────────────────────────────────────

export interface AMMState {
  yesShares: number;
  noShares: number;
  liquidity: number; // b parameter — controls price sensitivity
}

export type TradeAction = "BUY" | "SELL";

export interface TradeQuote {
  side: "YES" | "NO";
  action: TradeAction;
  shares: number;
  cost: number;
  fee: number;
  totalCost: number;
  effectivePrice: number;
  newYesPrice: number;
  newNoPrice: number;
  priceImpact: number;
  slippage: number;
}

export interface PositionValuation {
  unrealizedPnl: number;
  currentValue: number;
}

// ─── Numerically Stable Helpers ─────────────────────────

/**
 * log(exp(a) + exp(b)) using the log-sum-exp trick.
 * Subtracting the max before exponentiating prevents overflow.
 */
function logSumExp(a: number, b: number): number {
  const max = Math.max(a, b);
  if (!isFinite(max)) return max;
  return max + Math.log(Math.exp(a - max) + Math.exp(b - max));
}

// ─── Core Pricing ───────────────────────────────────────

/** Current probability (price) of YES — numerically stable */
export function getYesPrice(state: AMMState): number {
  const { yesShares, noShares, liquidity: b } = state;
  if (b <= 0) return 0.5;

  const a = yesShares / b;
  const c = noShares / b;
  const max = Math.max(a, c);
  if (!isFinite(max)) return a > c ? 1 : a < c ? 0 : 0.5;

  const expA = Math.exp(a - max);
  const expC = Math.exp(c - max);
  return expA / (expA + expC);
}

/** Current probability (price) of NO */
export function getNoPrice(state: AMMState): number {
  return 1 - getYesPrice(state);
}

// ─── Cost Calculation ───────────────────────────────────

/**
 * LMSR cost function: C(q) = b * ln(exp(q_yes/b) + exp(q_no/b))
 * Uses log-sum-exp to avoid overflow.
 */
function costFunction(qYes: number, qNo: number, b: number): number {
  return b * logSumExp(qYes / b, qNo / b);
}

/**
 * Marginal cost to trade `shares` of `side`.
 * For BUY:  positive (user pays)
 * For SELL: negative (user receives)
 */
export function getCost(
  state: AMMState,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction = "BUY"
): number {
  if (shares <= 0) return 0;
  const { yesShares, noShares, liquidity: b } = state;
  if (b <= 0) throw new Error("Liquidity parameter b must be positive");

  const currentCost = costFunction(yesShares, noShares, b);

  let newYes = yesShares;
  let newNo = noShares;
  if (side === "YES") {
    newYes += action === "BUY" ? shares : -shares;
  } else {
    newNo += action === "BUY" ? shares : -shares;
  }

  const newCost = costFunction(newYes, newNo, b);
  return newCost - currentCost;
}

// ─── Quote & Execution ─────────────────────────────────

function validateShares(shares: number): void {
  if (!Number.isFinite(shares) || shares <= 0) {
    throw new Error("Shares must be a positive finite number");
  }
  if (shares > MAX_SHARES_PER_TRADE) {
    throw new Error(`Shares exceed maximum of ${MAX_SHARES_PER_TRADE} per trade`);
  }
}

function simulateNewState(
  state: AMMState,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction
): AMMState {
  const delta = action === "BUY" ? shares : -shares;
  return {
    yesShares: side === "YES" ? state.yesShares + delta : state.yesShares,
    noShares: side === "NO" ? state.noShares + delta : state.noShares,
    liquidity: state.liquidity,
  };
}

/** Get a full trade quote including fees, slippage, and price impact */
export function getTradeQuote(
  state: AMMState,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction = "BUY"
): TradeQuote {
  validateShares(shares);

  const cost = getCost(state, side, shares, action);
  const fee = Math.abs(cost) * FEE_RATE;
  const totalCost = action === "BUY" ? cost + fee : cost - fee;
  const effectivePrice = Math.abs(cost) / shares;

  const oldYesPrice = getYesPrice(state);
  const newState = simulateNewState(state, side, shares, action);
  const newYesPrice = getYesPrice(newState);
  const newNoPrice = 1 - newYesPrice;

  const priceImpact = Math.abs(newYesPrice - oldYesPrice);
  const slippage = action === "BUY"
    ? Math.abs(effectivePrice - oldYesPrice) / oldYesPrice
    : Math.abs(effectivePrice - (side === "YES" ? oldYesPrice : 1 - oldYesPrice)) / (side === "YES" ? oldYesPrice : 1 - oldYesPrice);

  return {
    side,
    action,
    shares,
    cost,
    fee,
    totalCost,
    effectivePrice,
    newYesPrice,
    newNoPrice,
    priceImpact,
    slippage: Number.isFinite(slippage) ? slippage : 0,
  };
}

/** Execute a trade and return new AMM state + financials */
export function executeTrade(
  state: AMMState,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction = "BUY"
): { state: AMMState; cost: number; fee: number; price: number } {
  validateShares(shares);

  const cost = getCost(state, side, shares, action);
  const fee = Math.abs(cost) * FEE_RATE;
  const price = Math.abs(cost) / shares;
  const newState = simulateNewState(state, side, shares, action);

  return { state: newState, cost, fee, price };
}

// ─── P&L Calculations ──────────────────────────────────

/** Calculate unrealized P&L for a position (returns a number) */
export function calculatePnL(
  side: "YES" | "NO",
  shares: number,
  avgPrice: number,
  currentYesPrice: number
): number {
  const currentPrice = side === "YES" ? currentYesPrice : 1 - currentYesPrice;
  const currentValue = shares * currentPrice;
  const costBasis = shares * avgPrice;
  return currentValue - costBasis;
}

/** Get full position valuation (P&L + current value) */
export function getPositionValuation(
  side: "YES" | "NO",
  shares: number,
  avgPrice: number,
  currentYesPrice: number
): PositionValuation {
  const currentPrice = side === "YES" ? currentYesPrice : 1 - currentYesPrice;
  const currentValue = shares * currentPrice;
  const costBasis = shares * avgPrice;
  return { unrealizedPnl: currentValue - costBasis, currentValue };
}

// ─── Market Resolution ─────────────────────────────────

/** Resolve market and calculate payout */
export function calculateResolution(
  side: "YES" | "NO",
  shares: number,
  avgPrice: number,
  resolution: "YES" | "NO" | "INVALID"
): number {
  if (resolution === "INVALID") {
    return shares * avgPrice; // Refund at cost basis
  }
  return side === resolution ? shares * 1 : 0; // Winners get $1/share
}

// ─── Liquidity Management ──────────────────────────────

/**
 * Add liquidity by increasing the b parameter only.
 * This increases market depth without moving the current price.
 */
export function addLiquidity(state: AMMState, amount: number): AMMState {
  if (amount <= 0) throw new Error("Liquidity amount must be positive");
  return {
    yesShares: state.yesShares,
    noShares: state.noShares,
    liquidity: state.liquidity + amount,
  };
}

// ─── Formatting Helpers ────────────────────────────────

export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}%`;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Decimal to number helper */
export function toNumber(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return value;
}

/** Number to Decimal helper */
export function toDecimal(value: number): Decimal {
  return new Decimal(value);
}
