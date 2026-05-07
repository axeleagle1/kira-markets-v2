/**
 * Simulation startup integration.
 *
 * Provides singleton-safe start/stop/isRunning for the MarketActivitySimulator.
 * Callable from server bootstrap or the admin API.
 */

import { MarketActivitySimulator, type SimulationConfig } from "./marketSim";

let simulator: MarketActivitySimulator | null = null;

/**
 * Start the market simulator. No-op if already running.
 * Accepts optional config overrides (e.g., intensity).
 */
export async function startMarketSim(
  config?: Partial<SimulationConfig>
): Promise<void> {
  if (simulator?.isRunning()) {
    console.log("[SIMULATION] Already running");
    return;
  }

  simulator = new MarketActivitySimulator(config);
  await simulator.start();
}

/**
 * Stop the market simulator. No-op if not running.
 */
export function stopMarketSim(): void {
  if (!simulator) return;
  simulator.stop();
  simulator = null;
}

/**
 * Check if the simulator is currently running.
 */
export function isSimRunning(): boolean {
  return simulator?.isRunning() ?? false;
}

/**
 * Get the current simulator instance (if any).
 */
export function getSimulator(): MarketActivitySimulator | null {
  return simulator;
}
