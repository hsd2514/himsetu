import { action } from "./_generated/server";
import { v } from "convex/values";

// Fly-safe limits for the ship's charter helicopters.
const LIMITS = { windKt: 25, gustKt: 35, visM: 5000 };
const COORDS = { MAITRI: [-70.7667, 11.7333], BHARATI: [-69.4081, 76.1878] };

/**
 * Open-Meteo hourly forecast (free, no key) for the next 72 h, plus fly-safe
 * slots: runs of at least 2 consecutive hours inside all three limits.
 */
export const heliSlots = action({
  args: { stationCode: v.union(v.literal("MAITRI"), v.literal("BHARATI")) },
  handler: async (ctx, { stationCode }) => {
    if (!(await ctx.auth.getUserIdentity())) throw new Error("Please sign in.");
    const [lat, lon] = COORDS[stationCode];
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=wind_speed_10m,wind_gusts_10m,visibility&wind_speed_unit=kn&forecast_days=3&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const { hourly } = await res.json();

    const hours = hourly.time.map((t, i) => {
      const wind = hourly.wind_speed_10m[i];
      const gust = hourly.wind_gusts_10m[i];
      const vis = hourly.visibility[i];
      const safe = wind < LIMITS.windKt && gust < LIMITS.gustKt && (vis === null || vis > LIMITS.visM);
      return { ts: Date.parse(t + "Z"), wind, gust, vis, safe };
    });

    const slots = [];
    let start = null;
    hours.forEach((h, i) => {
      if (h.safe && start === null) start = i;
      const ends = !h.safe || i === hours.length - 1;
      if (start !== null && ends) {
        const end = h.safe ? i : i - 1;
        if (end - start + 1 >= 2) {
          const run = hours.slice(start, end + 1);
          slots.push({
            from: run[0].ts,
            to: run.at(-1).ts + 3600000,
            maxWind: Math.max(...run.map((r) => r.wind)),
            maxGust: Math.max(...run.map((r) => r.gust)),
            minVisKm: Math.min(...run.map((r) => (r.vis ?? 20000) / 1000)),
          });
        }
        start = null;
      }
    });
    return { stationCode, limits: LIMITS, hours, slots, fetchedAt: Date.now() };
  },
});
