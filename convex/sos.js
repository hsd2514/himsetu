import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { distanceKm } from "./geo";

/** Field preset: Safe / Delayed / Need help. Updates the team's check-in clock. */
export const checkIn = mutation({
  args: { personId: v.id("people"), lat: v.optional(v.number()), lon: v.optional(v.number()) },
  handler: async (ctx, { personId, lat, lon }) => {
    const now = Date.now();
    await ctx.db.patch(personId, { lastSeen: now, ...(lat !== undefined ? { lastLat: lat, lastLon: lon } : {}) });
    const teams = await ctx.db.query("teams").collect();
    for (const t of teams.filter((t) => t.memberIds.includes(personId))) {
      await ctx.db.patch(t._id, { lastCheckIn: now, ...(lat !== undefined ? { lat, lon } : {}) });
      for (const a of await ctx.db.query("alerts").withIndex("by_resolved", (q) => q.eq("resolved", false)).collect()) {
        if (a.type === "missed_checkin" && a.refId === t._id) await ctx.db.patch(a._id, { resolved: true });
      }
    }
  },
});

/** Cron: raise an alert for every team that has gone quiet past its interval. */
export const checkMissed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const open = await ctx.db.query("alerts").withIndex("by_resolved", (q) => q.eq("resolved", false)).collect();
    for (const t of await ctx.db.query("teams").collect()) {
      if (now - t.lastCheckIn < t.checkInEveryMin * 60000) continue;
      if (open.some((a) => a.type === "missed_checkin" && a.refId === t._id)) continue;
      await ctx.db.insert("alerts", {
        type: "missed_checkin",
        severity: "warning",
        stationCode: t.stationCode,
        refId: t._id,
        text: `${t.name} missed its check-in (every ${t.checkInEveryMin} min)`,
        ts: now,
        resolved: false,
      });
    }
  },
});

/** Demo helper: make one team overdue right now. */
export const simulateMissed = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const t = await ctx.db.get(teamId);
    await ctx.db.patch(teamId, { lastCheckIn: Date.now() - (t.checkInEveryMin + 1) * 60000 });
  },
});

export const openAlerts = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("alerts").withIndex("by_resolved", (q) => q.eq("resolved", false)).collect()).sort((a, b) => b.ts - a.ts),
});

export const resolve = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, { id }) => ctx.db.patch(id, { resolved: true }),
});

const SPEED_KMH = { foot: 8, vehicle: 20 };

/** Nearest other teams to a point, with ETA by travel mode. */
export const nearest = query({
  args: { lat: v.number(), lon: v.number(), excludeTeamId: v.optional(v.id("teams")) },
  handler: async (ctx, { lat, lon, excludeTeamId }) => {
    const teams = await ctx.db.query("teams").collect();
    return teams
      .filter((t) => t._id !== excludeTeamId)
      .filter((t) => distanceKm(lat, lon, t.lat, t.lon) < 150)
      .map((t) => {
        const km = distanceKm(lat, lon, t.lat, t.lon);
        return { ...t, km, etaMin: Math.round((km / SPEED_KMH[t.kind]) * 60) };
      })
      .sort((a, b) => a.etaMin - b.etaMin)
      .slice(0, 3);
  },
});

/** Most recent SOS that has reached Goa, with its position. */
export const latestDelivered = query({
  args: {},
  handler: async (ctx) => {
    const sent = await ctx.db.query("messages").order("desc").take(100);
    const m = sent.find((x) => x.priority === "sos" && (x.status === "delivered" || x.status === "read") && x.lat !== undefined);
    if (!m) return null;
    const from = await ctx.db.get(m.fromId);
    const team = (await ctx.db.query("teams").collect()).find((t) => t.memberIds.includes(m.fromId));
    return { ...m, fromName: from?.name, teamId: team?._id ?? null, teamName: team?.name ?? null };
  },
});
