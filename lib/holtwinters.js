/**
 * Additive Holt-Winters (triple exponential smoothing) for daily consumption
 * with a weekly season. Small, dependency-free, runs in Convex and the browser.
 *
 * @param {number[]} series  daily values, oldest first (needs at least 2 seasons)
 * @param {number} horizon   days to forecast
 * @returns {number[]}       forecast values, never negative
 */
export function holtWinters(series, horizon, { season = 7, alpha = 0.35, beta = 0.05, gamma = 0.25 } = {}) {
  const n = series.length;
  if (n < season * 2) {
    const mean = series.reduce((a, b) => a + b, 0) / Math.max(n, 1);
    return Array(horizon).fill(mean);
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const first = series.slice(0, season);
  const second = series.slice(season, season * 2);
  let level = mean(first);
  let trend = (mean(second) - mean(first)) / season;
  const seasonal = first.map((x) => x - level);

  for (let t = 0; t < n; t++) {
    const s = seasonal[t % season];
    const prevLevel = level;
    level = alpha * (series[t] - s) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[t % season] = gamma * (series[t] - level) + (1 - gamma) * s;
  }

  // Damp the trend so a short cold snap does not run away over 120 days.
  const out = [];
  let damped = 0;
  for (let h = 1; h <= horizon; h++) {
    damped += Math.pow(0.9, h);
    out.push(Math.max(0, level + damped * trend + seasonal[(n + h - 1) % season]));
  }
  return out;
}
