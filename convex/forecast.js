import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { holtWinters } from "../lib/holtwinters";

const DAY = 86400000;
const HORIZON = 120;

/**
 * Stock burn-down for one station + item:
 *   actual     stock level over the last 60 days (rebuilt from consumption)
 *   holtwinters live forecast of stock level for 120 days
 *   timesfm    imported TimesFM-3 forecast, if one exists
 */
export const burnDown = query({
  args: { stationCode: v.string(), item: v.string() },
  handler: async (ctx, { stationCode, item }) => {
    const inv = (await ctx.db.query("inventory").withIndex("by_station", (q) => q.eq("stationCode", stationCode)).collect()).find(
      (r) => r.item === item
    );
    if (!inv) return null;
    const used = await ctx.db
      .query("consumption")
      .withIndex("by_station_item", (q) => q.eq("stationCode", stationCode).eq("item", item))
      .collect();
    const today = Math.floor(Date.now() / DAY) * DAY;

    // Walk backwards from today's stock to reconstruct the level each day.
    const actual = [];
    let level = inv.qty;
    for (let i = used.length - 1; i >= 0; i--) {
      actual.unshift({ date: used[i].date + DAY, qty: level });
      level += used[i].qty;
    }

    const burn = holtWinters(used.map((u) => u.qty), HORIZON);
    const hw = [{ date: today, qty: inv.qty }];
    let stock = inv.qty;
    burn.forEach((b, i) => {
      stock -= b;
      hw.push({ date: today + (i + 1) * DAY, qty: Math.max(0, stock) });
    });
    const hwOut = hw.find((p) => p.qty < inv.safetyLevel)?.date ?? null;

    const tfm = await ctx.db
      .query("forecasts")
      .withIndex("by_station_item", (q) => q.eq("stationCode", stationCode).eq("item", item))
      .collect();
    const timesfm = tfm.find((f) => f.source === "timesfm") ?? null;

    return {
      unit: inv.unit,
      safetyLevel: inv.safetyLevel,
      actual,
      holtwinters: { points: hw, stockOutDate: hwOut },
      timesfm: timesfm ? { points: timesfm.points, stockOutDate: timesfm.stockOutDate ?? null } : null,
    };
  },
});

/** Import TimesFM-3 output produced offline by notebooks/timesfm_forecast.ipynb. */
export const importTimesfm = mutation({
  args: {
    rows: v.array(
      v.object({
        stationCode: v.union(v.literal("MAITRI"), v.literal("BHARATI")),
        item: v.string(),
        points: v.array(v.object({ date: v.number(), qty: v.number() })),
        stockOutDate: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { rows }) => {
    for (const r of rows) {
      const old = await ctx.db
        .query("forecasts")
        .withIndex("by_station_item", (q) => q.eq("stationCode", r.stationCode).eq("item", r.item))
        .collect();
      for (const o of old.filter((o) => o.source === "timesfm")) await ctx.db.delete(o._id);
      await ctx.db.insert("forecasts", { ...r, source: "timesfm" });
    }
    return rows.length;
  },
});

/** Earliest Holt-Winters stock-out per station/item, for KPIs and the inventory cards. */
export const stockOuts = query({
  args: {},
  handler: async (ctx) => {
    const today = Math.floor(Date.now() / DAY) * DAY;
    const out = [];
    for (const inv of await ctx.db.query("inventory").collect()) {
      const used = await ctx.db
        .query("consumption")
        .withIndex("by_station_item", (q) => q.eq("stationCode", inv.stationCode).eq("item", inv.item))
        .collect();
      const burn = holtWinters(used.map((u) => u.qty), HORIZON);
      let stock = inv.qty;
      let date = null;
      for (let i = 0; i < burn.length; i++) {
        stock -= burn[i];
        if (stock < inv.safetyLevel) {
          date = today + (i + 1) * DAY;
          break;
        }
      }
      out.push({ stationCode: inv.stationCode, item: inv.item, stockOutDate: date });
    }
    return out;
  },
});
