// Latency-budgeted on-device auction scoring.
// The WebNN gap today: a scoring / ranking model has no standard way
// to say "I must finish in X ms on this device, or fall back".
// Without that, an on-device auction either blocks the page or
// silently drops to a server model that leaks the very signals
// on-device auctioning was meant to protect.
//
// This module is the reference policy: time-box the ML score,
// fall back deterministically, and *record* which path was taken
// so measurement can be audited without identifying the user.

/**
 * Run a scoring function under a hard deadline.
 * @param {() => Promise<number>|number} scoreFn
 * @param {object} opts { budgetMs, fallbackScore, deviceTier: 'high'|'mid'|'low' }
 */
export async function scoreWithBudget(scoreFn, opts = {}) {
  const budgetMs = opts.budgetMs ?? 50;
  const fallbackScore = opts.fallbackScore ?? 0;
  // Low-tier devices get a smaller budget, not a larger one: the
  // auction must not punish slow devices by holding the page open.
  const effectiveBudget = opts.deviceTier === 'low' ? Math.min(budgetMs, 30) : budgetMs;
  const start = Date.now();
  let timedOut = false;
  const timeout = new Promise(resolve => setTimeout(() => { timedOut = true; resolve(null); }, effectiveBudget));
  const result = await Promise.race([Promise.resolve().then(scoreFn), timeout]);
  const elapsedMs = Date.now() - start;
  if (timedOut || result === null || typeof result !== 'number' || Number.isNaN(result)) {
    return { score: fallbackScore, path: 'fallback', timedOut: true, elapsedMs, budgetMs: effectiveBudget };
  }
  return { score: result, path: 'model', timedOut: false, elapsedMs, budgetMs: effectiveBudget };
}

/** Pick a model variant by device capability, not by user identity. */
export function selectModelVariant(device) {
  if (!device) return 'lite';
  if (device.webnn === true && (device.computeUnits ?? 0) >= 8) return 'full';
  if ((device.computeUnits ?? 0) >= 4) return 'standard';
  return 'lite';
}
