import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requirePermission, signedInQuery } from "./authz";
import { getSettings, missionNow, realTimeFor } from "./clock";

/**
 * Pass-gated link simulator. Messages touching a remote node wait for that node's
 * next satellite window, then go out most urgent first within a per-pass budget.
 */
const RANK = { sos: 0, medical: 1, ops: 2, normal: 3 };
const BUDGET_PER_PASS = 4;
const DROP_RATE = 0.05;

async function nextPass(ctx, stationCode, afterMission) {
  return ctx.db
    .query("passes")
    .withIndex("by_station_aos", (q) => q.eq("stationCode", stationCode).gt("aos", afterMission))
    .first();
}

/** Make sure a release job exists for this station's next window. Returns real release time. */
export async function ensureWindow(ctx, stationCode) {
  const existing = await ctx.db.query("linkWindows").withIndex("by_station", (q) => q.eq("stationCode", stationCode)).first();
  if (existing) return existing.releaseAt;
  const settings = await getSettings(ctx);
  const pass = await nextPass(ctx, stationCode, missionNow(settings));
  if (!pass) {
    await ctx.scheduler.runAfter(0, internal.orbits.refresh, {});
    return null;
  }
  const releaseAt = realTimeFor(settings, pass.aos);
  await ctx.db.insert("linkWindows", { stationCode, passId: pass._id, releaseAt });
  await ctx.scheduler.runAt(releaseAt, internal.link.releaseWindow, { stationCode });
  const queued = await ctx.db
    .query("messages")
    .withIndex("by_gate_status", (q) => q.eq("gateStation", stationCode).eq("status", "queued"))
    .collect();
  for (const m of queued) await ctx.db.patch(m._id, { releaseAt });
  return releaseAt;
}

export const releaseWindow = internalMutation({
  args: { stationCode: v.string() },
  handler: async (ctx, { stationCode }) => {
    const win = await ctx.db.query("linkWindows").withIndex("by_station", (q) => q.eq("stationCode", stationCode)).first();
    if (!win || win.releaseAt > Date.now() + 1000) return; // stale job
    await ctx.db.delete(win._id);

    const queued = await ctx.db
      .query("messages")
      .withIndex("by_gate_status", (q) => q.eq("gateStation", stationCode).eq("status", "queued"))
      .collect();
    queued.sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.queuedAt - b.queuedAt);

    const now = Date.now();
    for (const m of queued.slice(0, BUDGET_PER_PASS)) {
      if (m.priority !== "sos" && Math.random() < DROP_RATE) {
        await ctx.db.patch(m._id, { attempts: m.attempts + 1 });
        continue;
      }
      await ctx.db.patch(m._id, { status: "sent", sentAt: now, attempts: m.attempts + 1 });
      await ctx.scheduler.runAfter(2000 + Math.random() * 6000, internal.link.markDelivered, { id: m._id });
    }
    // Anything still queued after this window rides the next one.
    const left = await ctx.db
      .query("messages")
      .withIndex("by_gate_status", (q) => q.eq("gateStation", stationCode).eq("status", "queued"))
      .first();
    if (left) await ensureWindow(ctx, stationCode);
  },
});

export const markDelivered = internalMutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    const m = await ctx.db.get(id);
    if (!m || m.status !== "sent") return;
    await ctx.db.patch(id, { status: "delivered", deliveredAt: Date.now() });
    if (m.priority === "sos") {
      await ctx.db.insert("alerts", {
        type: "sos",
        severity: "critical",
        stationCode: m.fromStation,
        refId: id,
        text: `SOS received from ${m.fromStation} field team`,
        ts: Date.now(),
        resolved: false,
      });
    }
  },
});

/** After passes are recomputed, drop old windows and reschedule anything waiting. */
export const rescheduleAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const w of await ctx.db.query("linkWindows").collect()) await ctx.db.delete(w._id);
    const queued = await ctx.db.query("messages").withIndex("by_status", (q) => q.eq("status", "queued")).collect();
    const stations = new Set(queued.map((m) => m.gateStation).filter(Boolean));
    for (const s of stations) await ensureWindow(ctx, s);
  },
});

export const setDemoSpeed = mutation({
  args: { demoSpeed: v.union(v.literal(1), v.literal(60)) },
  handler: async (ctx, { demoSpeed }) => {
    await requirePermission(ctx, "demo.control");
    // Restart the mission clock at "now" so passes are recomputed on the new time scale.
    const s = await ctx.db.query("settings").first();
    const row = { demoSpeed, demoStartTs: Date.now() };
    if (s) await ctx.db.patch(s._id, row);
    else await ctx.db.insert("settings", row);
    await ctx.scheduler.runAfter(0, internal.orbits.refresh, {});
  },
});

export const status = signedInQuery({
  args: {},
  handler: async (ctx) => {
    const windows = await ctx.db.query("linkWindows").collect();
    const queued = await ctx.db.query("messages").withIndex("by_status", (q) => q.eq("status", "queued")).collect();
    return { windows, queuedCount: queued.length };
  },
});
