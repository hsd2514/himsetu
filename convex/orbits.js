"use node";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles, degreesToRadians } from "satellite.js";
import { IRIDIUM_TLE } from "./data/iridiumTle";

/** SGP4 pass prediction (satellite.js needs the Node runtime). */
const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=tle";
const REMOTE = ["SHIP", "MAITRI", "BHARATI"];
// Demo link budget: each node is assigned a few satellites so windows are spaced out
// the way a real licensed backup plan would be, instead of near-continuous polar coverage.
const LINK_SATS = 3;
const HORIZON_MS = 24 * 3600 * 1000;
const STEP_MS = 30 * 1000;
const MIN_ELEV = 10;

function parseTle(text) {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).filter(Boolean);
  const sats = [];
  for (let i = 0; i + 2 < lines.length + 1; i += 3) {
    if (!lines[i + 2]) break;
    sats.push({ name: lines[i].trim(), rec: twoline2satrec(lines[i + 1], lines[i + 2]) });
  }
  return sats;
}

function elevationDeg(rec, observer, date) {
  const pv = propagate(rec, date);
  if (!pv || !pv.position) return -90;
  const ecf = eciToEcf(pv.position, gstime(date));
  return (ecfToLookAngles(observer, ecf).elevation * 180) / Math.PI;
}

/** Passes above MIN_ELEV for one observer across [from, from + HORIZON]. */
export function predictPasses(sats, station, from) {
  const observer = { latitude: degreesToRadians(station.lat), longitude: degreesToRadians(station.lon), height: 0.05 };
  const out = [];
  for (const sat of sats) {
    let cur = null;
    for (let t = from; t <= from + HORIZON_MS; t += STEP_MS) {
      const el = elevationDeg(sat.rec, observer, new Date(t));
      if (el > MIN_ELEV) {
        if (!cur) cur = { satName: sat.name, aos: t, los: t, maxElevDeg: el };
        cur.los = t;
        cur.maxElevDeg = Math.max(cur.maxElevDeg, el);
      } else if (cur) {
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
  }
  return out.sort((a, b) => a.aos - b.aos);
}

export const refresh = internalAction({
  args: {},
  handler: async (ctx) => {
    let text = null;
    let source = "celestrak";
    try {
      const res = await fetch(CELESTRAK, { signal: AbortSignal.timeout(8000) });
      if (res.ok) text = await res.text();
      if (!text || !text.includes("IRIDIUM")) text = null;
    } catch {}
    if (!text) {
      const cached = await ctx.runQuery(internal.passes.latestTle, {});
      text = cached?.text ?? IRIDIUM_TLE;
      source = cached ? cached.source : "bundled";
    } else {
      await ctx.runMutation(internal.passes.saveTle, { text, source });
    }
    const { stations, now } = await ctx.runQuery(internal.passes.context, {});
    const sats = parseTle(text).sort((a, b) => a.name.localeCompare(b.name));
    const rows = [];
    for (const code of REMOTE) {
      const st = stations.find((s) => s.code === code);
      if (!st) continue;
      // Different stations get different satellites, like separate airtime contracts.
      const offset = REMOTE.indexOf(code) * LINK_SATS * 4;
      const assigned = sats.slice(offset, offset + LINK_SATS);
      for (const p of predictPasses(assigned, st, now)) rows.push({ stationCode: code, ...p });
    }
    await ctx.runMutation(internal.passes.replace, { from: now, rows });
    return { source, satellites: sats.length, passes: rows.length };
  },
});

/** Manual trigger from the UI. */
export const refreshNow = action({
  args: { actorId: v.id("people") },
  handler: async (ctx, { actorId }) => {
    await ctx.runQuery(internal.people.assertCan, { actorId, perm: "demo.control" });
    return ctx.runAction(internal.orbits.refresh, {});
  },
});

