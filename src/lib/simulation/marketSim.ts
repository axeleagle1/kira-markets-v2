/**
 * Market Activity Simulator
 *
 * Runs background bots that trade through the real executeMarketTrade pipeline.
 * All trades use the system bot user and go through full validation, locking,
 * balance checks, and position tracking.
 *
 * Three behaviors:
 * 1. Market Maker Bot — mean-reverting micro-trades to keep prices alive
 * 2. Retail Noise Bot — random small trades simulating organic users
 * 3. Volume Drift Simulator — periodic trades to prevent flat charts
 */

import { db } from "@/lib/db";
import { executeMarketTrade } from "@/lib/trades";
import { toNumber } from "@/lib/amm";
import { getBotUserId, ensureBotBalance } from "./botUser";
import type { TradeAction } from "@/lib/amm";

// ─── Configuration ─────────────────────────────────────

export interface SimulationConfig {
  /** 0.0 (off) to 1.0 (max activity). Controls frequency and size. */
  intensity: number;
  /** Minimum ms between ticks for any single market. */
  marketCooldownMs: number;
  /** Log each simulated trade to console. */
  verbose: boolean;
}

const DEFAULT_CONFIG: SimulationConfig = {
  intensity: 0.5,
  marketCooldownMs: 2000,
  verbose: true,
};

// ─── Types ─────────────────────────────────────────────

interface ActiveMarket {
  id: string;
  yesPrice: number;
  noPrice: number;
  endsAt: Date | null;
}

type SimReason = "market_maker" | "retail_noise" | "volume_drift";

// ─── Simulator ─────────────────────────────────────────

// ─── Log Throttling ───────────────────────────────────

const LOG_THROTTLE_MS = 60_000;
const lastLogTime = new Map<string, number>();

function throttledLog(key: string, ...args: unknown[]): void {
  const now = Date.now();
  const last = lastLogTime.get(key);
  if (last && now - last < LOG_THROTTLE_MS) return;
  lastLogTime.set(key, now);
  console.log(...args);
}

export class MarketActivitySimulator {
  private config: SimulationConfig;
  private running = false;
  private intervals: ReturnType<typeof setInterval>[] = [];
  private lastTradeTime = new Map<string, number>();
  private botUserId: string | null = null;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Lifecycle ──────────────────────────────────────

  async start(): Promise<void> {
    if (this.running) return;

    this.botUserId = await getBotUserId();
    await ensureBotBalance();
    this.running = true;

    const { intensity } = this.config;

    // Market Maker Bot: every 2–5s (scaled by intensity)
    const makerInterval = lerp(5000, 2000, intensity);
    this.intervals.push(
      setInterval(() => this.tickMarketMaker(), makerInterval)
    );

    // Retail Noise Bot: every 5–15s (scaled by intensity)
    const noiseInterval = lerp(15000, 5000, intensity);
    this.intervals.push(
      setInterval(() => this.tickRetailNoise(), noiseInterval)
    );

    // Volume Drift: every 10s
    this.intervals.push(
      setInterval(() => this.tickVolumeDrift(), 10000)
    );

    // Balance top-up check every 60s
    this.intervals.push(
      setInterval(() => ensureBotBalance(), 60_000)
    );

    console.log(
      `[SIMULATION] Started — intensity=${intensity}, maker=${makerInterval}ms, noise=${noiseInterval}ms`
    );
  }

  stop(): void {
    if (!this.running) return;
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.running = false;
    console.log("[SIMULATION] Stopped");
  }

  isRunning(): boolean {
    return this.running;
  }

  updateIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    console.log(`[SIMULATION] Intensity updated to ${this.config.intensity}`);
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  // ── Behavior: Market Maker ─────────────────────────

  private async tickMarketMaker(): Promise<void> {
    if (!this.running || !this.botUserId) return;

    const market = await this.pickRandomActiveMarket();
    if (!market) return;
    if (!this.canTrade(market.id)) return;

    const { side, action, shares } = this.decideMarketMakerTrade(market);

    await this.executeSimTrade(
      this.botUserId,
      market.id,
      side,
      shares,
      action,
      "market_maker"
    );
  }

  private decideMarketMakerTrade(market: ActiveMarket): {
    side: "YES" | "NO";
    action: TradeAction;
    shares: number;
  } {
    const { intensity } = this.config;
    const yesPrice = market.yesPrice;

    // Mean reversion bias
    let side: "YES" | "NO";
    let action: TradeAction;

    if (yesPrice > 0.7) {
      // Price too high — sell YES / buy NO to push down
      side = Math.random() < 0.7 ? "YES" : "NO";
      action = side === "YES" ? "SELL" : "BUY";
    } else if (yesPrice < 0.3) {
      // Price too low — buy YES / sell NO to push up
      side = Math.random() < 0.7 ? "YES" : "NO";
      action = side === "YES" ? "BUY" : "SELL";
    } else {
      // Near equilibrium — mild random trading
      side = Math.random() < 0.5 ? "YES" : "NO";
      action = Math.random() < 0.5 ? "BUY" : "SELL";
    }

    // Size: 0.5–5 shares, scaled by intensity
    const baseSize = lerp(0.5, 5, Math.random());
    const shares = roundShares(baseSize * intensity);

    return { side, action, shares: Math.max(0.1, shares) };
  }

  // ── Behavior: Retail Noise ─────────────────────────

  private async tickRetailNoise(): Promise<void> {
    if (!this.running || !this.botUserId) return;

    const market = await this.pickRandomActiveMarket();
    if (!market) return;
    if (!this.canTrade(market.id)) return;

    const { intensity } = this.config;
    const side: "YES" | "NO" = Math.random() < 0.5 ? "YES" : "NO";
    const action: TradeAction = Math.random() < 0.5 ? "BUY" : "SELL";
    const shares = Math.max(0.1, roundShares(lerp(0.1, 2, Math.random()) * intensity));

    await this.executeSimTrade(
      this.botUserId,
      market.id,
      side,
      shares,
      action,
      "retail_noise"
    );
  }

  // ── Behavior: Volume Drift ─────────────────────────

  private async tickVolumeDrift(): Promise<void> {
    if (!this.running || !this.botUserId) return;

    const market = await this.pickRandomActiveMarket();
    if (!market) return;
    if (!this.canTrade(market.id)) return;

    const { intensity } = this.config;
    const side: "YES" | "NO" = Math.random() < 0.5 ? "YES" : "NO";
    const shares = Math.max(0.1, roundShares(lerp(0.1, 1.5, Math.random()) * intensity));

    // Volume drift is always BUY to slowly build positions
    await this.executeSimTrade(
      this.botUserId,
      market.id,
      side,
      shares,
      "BUY",
      "volume_drift"
    );
  }

  // ── Trade Execution ────────────────────────────────

  private async executeSimTrade(
    userId: string,
    marketId: string,
    side: "YES" | "NO",
    shares: number,
    action: TradeAction,
    reason: SimReason
  ): Promise<void> {
    try {
      const result = await executeMarketTrade(
        userId,
        marketId,
        side,
        shares,
        action
      );

      this.lastTradeTime.set(marketId, Date.now());

      if (this.config.verbose) {
        console.log(
          `[SIMULATION] ${reason} | ${action} ${shares} ${side} on ${marketId.slice(0, 8)}… | ` +
          `cost=$${result.cost.toFixed(4)} | newPrice=${(result.newYesPrice * 100).toFixed(1)}%`
        );
      }
    } catch (error) {
      // Expected failures: insufficient balance, expired market, etc.
      // Throttled — same error+market logged at most once per 60s.
      if (this.config.verbose) {
        const msg = error instanceof Error ? error.message : "unknown";
        throttledLog(
          `err:${reason}:${marketId}:${msg}`,
          `[SIMULATION] ${reason} trade skipped: ${msg}`
        );
      }
    }
  }

  // ── Market Selection ───────────────────────────────

  private async pickRandomActiveMarket(): Promise<ActiveMarket | null> {
    const markets = await db.market.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        yesPrice: true,
        noPrice: true,
        endsAt: true,
      },
    });

    // Filter out expired markets
    const now = new Date();
    const active = markets.filter(
      (m) => !m.endsAt || m.endsAt > now
    );

    if (active.length === 0) return null;

    const picked = active[Math.floor(Math.random() * active.length)];
    return {
      id: picked.id,
      yesPrice: toNumber(picked.yesPrice),
      noPrice: toNumber(picked.noPrice),
      endsAt: picked.endsAt,
    };
  }

  private canTrade(marketId: string): boolean {
    const last = this.lastTradeTime.get(marketId);
    if (!last) return true;
    return Date.now() - last >= this.config.marketCooldownMs;
  }
}

// ─── Helpers ───────────────────────────────────────────

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * Math.max(0, Math.min(1, t));
}

function roundShares(v: number): number {
  return Math.round(v * 100) / 100;
}
