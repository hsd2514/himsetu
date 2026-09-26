import { query } from "./_generated/server";

/** Stock rows with a simple days-left estimate from the last 14 days of burn. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("inventory").collect();
    const since = Date.now() - 14 * 86400000;
    return Promise.all(
      rows.map(async (r) => {
        const used = await ctx.db
          .query("consumption")
          .withIndex("by_station_item", (q) => q.eq("stationCode", r.stationCode).eq("item", r.item).gte("date", since))
          .collect();
        const daily = used.reduce((s, c) => s + c.qty, 0) / Math.max(used.length, 1);
        const daysToSafety = daily > 0 ? (r.qty - r.safetyLevel) / daily : null;
        return { ...r, daily, daysToSafety };
      })
    );
  },
});
