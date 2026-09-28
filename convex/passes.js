import { internalMutation, internalQuery, query } from "./_generated/server";
import { signedInQuery } from "./authz";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getSettings, missionNow } from "./clock";

const REMOTE = ["SHIP", "MAITRI", "BHARATI"];

export const latestTle = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("tles").order("desc").first(),
});

export const saveTle = internalMutation({
  args: { text: v.string(), source: v.string() },
  handler: async (ctx, { text, source }) => {
    for (const old of await ctx.db.query("tles").collect()) await ctx.db.delete(old._id);
    await ctx.db.insert("tles", { text, source, fetchedAt: Date.now() });
  },
});

export const context = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettings(ctx);
    return { stations: await ctx.db.query("stations").collect(), now: missionNow(settings) };
  },
});

export const replace = internalMutation({
  args: {
    from: v.number(),
    rows: v.array(
      v.object({ stationCode: v.string(), satName: v.string(), aos: v.number(), los: v.number(), maxElevDeg: v.number() })
    ),
  },
  handler: async (ctx, { rows }) => {
    const windows = await ctx.db.query("linkWindows").collect();
    const keep = new Set(windows.map((w) => w.passId));
    for (const p of await ctx.db.query("passes").collect()) if (!keep.has(p._id)) await ctx.db.delete(p._id);
    for (const r of rows) await ctx.db.insert("passes", r);
    await ctx.scheduler.runAfter(0, internal.link.rescheduleAll, {});
  },
});

/** Called by cron: recompute when the mission clock nears the end of the predicted horizon. */
export const ensureHorizon = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettings(ctx);
    const now = missionNow(settings);
    const latest = (await ctx.db.query("passes").collect()).reduce((m, p) => Math.max(m, p.aos), 0);
    if (latest < now + 6 * 3600 * 1000) await ctx.scheduler.runAfter(0, internal.orbits.refresh, {});
  },
});

/** Upcoming passes per remote station, in mission time, plus the clock needed to render countdowns. */
export const upcoming = signedInQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettings(ctx);
    const now = missionNow(settings);
    const result = {};
    for (const code of REMOTE) {
      result[code] = await ctx.db
        .query("passes")
        .withIndex("by_station_aos", (q) => q.eq("stationCode", code).gte("aos", now - 20 * 60 * 1000))
        .take(8);
    }
    const tle = await ctx.db.query("tles").first();
    return { settings, passes: result, tleSource: tle?.source ?? "bundled", tleFetchedAt: tle?.fetchedAt ?? null };
  },
});
