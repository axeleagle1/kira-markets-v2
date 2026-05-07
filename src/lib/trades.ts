/**
 * Trade execution service — handles the full trade lifecycle
 *
 * All trade mutations run inside a Prisma transaction with row-level locks
 * (SELECT ... FOR UPDATE) to prevent race conditions and double-spending.
 */

import { db } from "./db";
import {
  executeTrade,
  getTradeQuote,
  getYesPrice,
  toNumber,
  toDecimal,
  FEE_RATE,
  type AMMState,
  type TradeAction,
} from "./amm";
import { Decimal } from "@prisma/client/runtime/library";

// ─── Types ─────────────────────────────────────────────

export interface TradeResult {
  tradeId: string;
  side: "YES" | "NO";
  action: TradeAction;
  shares: number;
  price: number;
  cost: number;
  fee: number;
  newBalance: number;
  newYesPrice: number;
  newNoPrice: number;
  newVolume: number;
}

// ─── Trade Execution ───────────────────────────────────

/**
 * Execute a market order (buy or sell) inside a transaction.
 *
 * Guarantees:
 * - Market row locked with FOR UPDATE (no concurrent price races)
 * - User row locked with FOR UPDATE (no double-spend)
 * - Atomic update of market state, user balance, position, trade record, price history
 */
export async function executeMarketTrade(
  userId: string,
  marketId: string,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction = "BUY"
): Promise<TradeResult> {
  return await db.$transaction(async (tx) => {
    // ── Lock market row ──────────────────────────────
    const market = await tx.$queryRaw<
      Array<{
        id: string;
        status: string;
        yes_shares: Decimal;
        no_shares: Decimal;
        liquidity: Decimal;
        yes_price: Decimal;
        volume: Decimal;
        total_trades: number;
        ends_at: Date | null;
      }>
    >`SELECT id, status, yes_shares, no_shares, liquidity, yes_price, volume, total_trades, ends_at
      FROM markets WHERE id = ${marketId} FOR UPDATE`;

    if (!market.length) throw new Error("Market not found");
    const m = market[0];

    // ── Market constraints ───────────────────────────
    if (m.status !== "ACTIVE") throw new Error("Market is not active");
    if (m.ends_at && new Date(m.ends_at) < new Date()) {
      throw new Error("Market has expired");
    }

    // ── Lock user row ────────────────────────────────
    const user = await tx.$queryRaw<
      Array<{ id: string; balance: Decimal }>
    >`SELECT id, balance FROM users WHERE id = ${userId} FOR UPDATE`;

    if (!user.length) throw new Error("User not found");

    // ── Build AMM state ──────────────────────────────
    const ammState: AMMState = {
      yesShares: toNumber(m.yes_shares),
      noShares: toNumber(m.no_shares),
      liquidity: toNumber(m.liquidity),
    };

    // ── For sells, validate position exists ───────────
    let existingPosition: Array<{
      id: string;
      shares: Decimal;
      avg_price: Decimal;
      total_cost: Decimal;
    }> = [];

    if (action === "SELL") {
      existingPosition = await tx.$queryRaw<
        Array<{
          id: string;
          shares: Decimal;
          avg_price: Decimal;
          total_cost: Decimal;
        }>
      >`SELECT id, shares, avg_price, total_cost FROM positions
        WHERE user_id = ${userId} AND market_id = ${marketId} AND side = ${side}`;

      if (!existingPosition.length) {
        throw new Error("No position to sell");
      }
      if (toNumber(existingPosition[0].shares) < shares) {
        throw new Error("Insufficient shares to sell");
      }
    }

    // ── Execute AMM trade ────────────────────────────
    const { state: newState, cost, fee, price } = executeTrade(ammState, side, shares, action);

    const totalCost = action === "BUY" ? cost + fee : cost - fee;
    const newYesPrice = getYesPrice(newState);
    const newNoPrice = 1 - newYesPrice;

    // ── Balance check (buy) or credit (sell) ─────────
    if (action === "BUY") {
      if (toNumber(user[0].balance) < totalCost) {
        throw new Error("Insufficient balance");
      }
    }

    // ── Update market AMM state ──────────────────────
    const newVolume = toNumber(m.volume) + Math.abs(totalCost);
    await tx.$executeRaw`
      UPDATE markets SET
        yes_shares = ${newState.yesShares},
        no_shares = ${newState.noShares},
        yes_price = ${newYesPrice},
        no_price = ${newNoPrice},
        volume = volume + ${Math.abs(totalCost)},
        total_trades = total_trades + 1,
        updated_at = NOW()
      WHERE id = ${marketId}
    `;

    // ── Update user balance ──────────────────────────
    if (action === "BUY") {
      await tx.$executeRaw`
        UPDATE users SET balance = balance - ${totalCost}, updated_at = NOW() WHERE id = ${userId}
      `;
    } else {
      await tx.$executeRaw`
        UPDATE users SET balance = balance + ${Math.abs(totalCost)}, updated_at = NOW() WHERE id = ${userId}
      `;
    }

    // ── Create trade record ──────────────────────────
    const trade = await tx.$queryRaw<
      Array<{ id: string }>
    >`INSERT INTO trades (id, user_id, market_id, side, shares, price, cost, fee, created_at)
      VALUES (gen_random_uuid(), ${userId}, ${marketId}, ${side}, ${shares}, ${price}, ${Math.abs(cost)}, ${fee}, NOW())
      RETURNING id`;

    // ── Update or create position ────────────────────
    if (action === "BUY") {
      await handleBuyPosition(tx, userId, marketId, side, shares, price, cost);
    } else {
      await handleSellPosition(tx, existingPosition[0], shares, price);
    }

    // ── Record price history ─────────────────────────
    await tx.$executeRaw`
      INSERT INTO price_history (id, market_id, yes_price, no_price, volume, timestamp)
      VALUES (gen_random_uuid(), ${marketId}, ${newYesPrice}, ${newNoPrice}, ${Math.abs(totalCost)}, NOW())
    `;

    // ── Get updated balance ──────────────────────────
    const updatedUser = await tx.$queryRaw<
      Array<{ balance: Decimal }>
    >`SELECT balance FROM users WHERE id = ${userId}`;

    // Safety assertion: balance must never be negative
    const finalBalance = toNumber(updatedUser[0].balance);
    if (finalBalance < 0) {
      throw new Error(
        `[CRITICAL] Negative balance detected for user ${userId}: ${finalBalance}. ` +
        `Trade: ${action} ${shares} ${side} on ${marketId}. This is a bug.`
      );
    }

    return {
      tradeId: trade[0].id,
      side,
      action,
      shares,
      price,
      cost: Math.abs(cost),
      fee,
      newBalance: toNumber(updatedUser[0].balance),
      newYesPrice,
      newNoPrice,
      newVolume,
    };
  });
}

// ─── Position Helpers ──────────────────────────────────

async function handleBuyPosition(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  userId: string,
  marketId: string,
  side: "YES" | "NO",
  shares: number,
  price: number,
  cost: number
) {
  const existing = await tx.$queryRaw<
    Array<{
      id: string;
      shares: Decimal;
      avg_price: Decimal;
      total_cost: Decimal;
    }>
  >`SELECT id, shares, avg_price, total_cost FROM positions
    WHERE user_id = ${userId} AND market_id = ${marketId} AND side = ${side}`;

  if (existing.length) {
    const pos = existing[0];
    const oldShares = toNumber(pos.shares);
    const oldTotalCost = toNumber(pos.total_cost);
    const newShares = oldShares + shares;
    const newTotalCost = oldTotalCost + Math.abs(cost);
    const newAvgPrice = newTotalCost / newShares;

    await tx.$executeRaw`
      UPDATE positions SET
        shares = ${newShares},
        avg_price = ${newAvgPrice},
        total_cost = ${newTotalCost},
        updated_at = NOW()
      WHERE id = ${pos.id}
    `;
  } else {
    await tx.$executeRaw`
      INSERT INTO positions (id, user_id, market_id, side, shares, avg_price, total_cost, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, ${marketId}, ${side}, ${shares}, ${price}, ${Math.abs(cost)}, NOW(), NOW())
    `;
  }
}

async function handleSellPosition(
  tx: Parameters<Parameters<typeof db["$transaction"]>[0]>[0],
  pos: { id: string; shares: Decimal; avg_price: Decimal; total_cost: Decimal },
  shares: number,
  _price: number
) {
  const oldShares = toNumber(pos.shares);
  const avgPrice = toNumber(pos.avg_price);
  const oldTotalCost = toNumber(pos.total_cost);
  const newShares = oldShares - shares;

  if (newShares <= 0.0001) {
    // Position fully closed — delete
    await tx.$executeRaw`DELETE FROM positions WHERE id = ${pos.id}`;
  } else {
    // Partial sell — reduce shares and totalCost proportionally, keep avgPrice
    const newTotalCost = newShares * avgPrice;
    await tx.$executeRaw`
      UPDATE positions SET
        shares = ${newShares},
        total_cost = ${newTotalCost},
        updated_at = NOW()
      WHERE id = ${pos.id}
    `;
  }
}

// ─── Quote (read-only) ─────────────────────────────────

/**
 * Get a trade quote without executing. Uses Prisma ORM (no locks needed).
 */
export async function getQuote(
  marketId: string,
  side: "YES" | "NO",
  shares: number,
  action: TradeAction = "BUY"
) {
  const market = await db.market.findUnique({ where: { id: marketId } });
  if (!market) throw new Error("Market not found");
  if (market.status !== "ACTIVE") throw new Error("Market is not active");
  if (market.endsAt && market.endsAt < new Date()) {
    throw new Error("Market has expired");
  }

  const ammState: AMMState = {
    yesShares: toNumber(market.yesShares),
    noShares: toNumber(market.noShares),
    liquidity: toNumber(market.liquidity),
  };

  const quote = getTradeQuote(ammState, side, shares, action);

  return {
    ...quote,
    currentYesPrice: toNumber(market.yesPrice),
    currentNoPrice: toNumber(market.noPrice),
  };
}
