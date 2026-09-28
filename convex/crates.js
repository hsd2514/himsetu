import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission, signedInQuery } from "./authz";

const HOPS = ["warehouse", "port", "ship_hold", "helideck", "station"];
const HOP_STATION = { warehouse: "GOA", port: "CPT", ship_hold: "SHIP", helideck: "SHIP" };
const MAX_NOTE = 200;

/** Labels are printed upper-case; accept what a person types or a scanner reads. */
const normalizeLabel = (s) => s.trim().toUpperCase();

export const list = signedInQuery({
  args: {},
  handler: async (ctx) => {
    const crates = await ctx.db.query("crates").order("desc").collect();
    return crates;
  },
});

export const get = signedInQuery({
  args: { id: v.id("crates") },
  handler: async (ctx, { id }) => {
    const crate = await ctx.db.get(id);
    if (!crate) return null;

    const events = await ctx.db
      .query("events")
      .withIndex("by_crate", (q) => q.eq("crateId", id))
      .collect();

    return { crate, events };
  },
});

export const byQr = signedInQuery({
  args: { qrId: v.string() },
  handler: async (ctx, { qrId }) =>
    ctx.db.query("crates").withIndex("by_qr", (q) => q.eq("qrId", normalizeLabel(qrId))).first(),
});

export const create = mutation({
  args: {
    item: v.string(),
    weightKg: v.number(),
    hazmat: v.boolean(),
    coldChain: v.boolean(),
    priority: v.number(),
    destination: v.union(v.literal("MAITRI"), v.literal("BHARATI")),
  },

  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "crate.create");
    const scannedBy = actor.name;
    /*
     * Collision-safe crate IDs:
     * - A persistent counter is used instead of counting crate rows.
     * - The counter is never decreased when crates are deleted.
     * - On first initialization, existing HMS IDs are inspected so
     *   seeded/existing crates cannot collide with the first new crate.
     */
    const SEQ_NAME = "crate_seq";

    const seqRow = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", SEQ_NAME))
      .first();

    let nextSeq;

    if (seqRow === null) {
      // The counter may not exist yet even when seeded/existing crates do.
      // Find the highest existing HMS numeric suffix.
      const existingCrates = await ctx.db.query("crates").collect();

      let maxSuffix = 1000;

      for (const crate of existingCrates) {
        const match = /^HMS-(\d+)$/.exec(crate.qrId);
        if (!match) continue;

        const suffix = Number(match[1]);
        if (Number.isSafeInteger(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }

      // Counter stores the offset from 1000.
      // Example:
      // existing HMS-1016 -> counter = 16 -> next = 17 -> HMS-1017
      // no existing crates -> counter = 0 -> next = 1 -> HMS-1001
      const currentSeq = Math.max(0, maxSuffix - 1000);

      nextSeq = currentSeq + 1;

      await ctx.db.insert("counters", {
        name: SEQ_NAME,
        value: nextSeq,
      });
    } else {
      nextSeq = seqRow.value + 1;

      await ctx.db.patch(seqRow._id, {
        value: nextSeq,
      });
    }

    const qrId = `HMS-${1000 + nextSeq}`;
    const now = Date.now();

    const rest = args;

    const id = await ctx.db.insert("crates", {
      ...rest,
      qrId,
      status: "warehouse",
      currentStation: "GOA",
      createdAt: now,
    });

    await ctx.db.insert("events", {
      crateId: id,
      hop: "warehouse",
      stationCode: "GOA",
      scannedBy,
      ts: now,
    });

    return { id, qrId };
  },
});

/**
 * Log a custody handover. Hops only move forward (skipping one is allowed, e.g. a
 * crate craned straight from the hold to the station), so a repeat scan or a
 * double tap never adds a duplicate event.
 */
export const scan = mutation({
  args: {
    qrId: v.string(),
    hop: v.union(
      v.literal("warehouse"),
      v.literal("port"),
      v.literal("ship_hold"),
      v.literal("helideck"),
      v.literal("station")
    ),
    note: v.optional(v.string()),
  },

  handler: async (ctx, { qrId, hop, note }) => {
    const actor = await requirePermission(ctx, "crate.scan");
    const scannedBy = actor.name;
    const label = normalizeLabel(qrId);
    const crate = await ctx.db.query("crates").withIndex("by_qr", (q) => q.eq("qrId", label)).first();
    if (!crate) throw new Error(`No crate with label ${label}`);
    const from = HOPS.indexOf(crate.status);
    const to = HOPS.indexOf(hop);
    if (to === from) throw new Error(`${label} is already logged at this hop`);
    if (to < from) throw new Error(`${label} is past this hop; custody only moves forward`);
    const who = scannedBy.trim();
    if (!who) throw new Error("Scanner name is required");
    const text = note?.trim().slice(0, MAX_NOTE) || undefined;

    const stationCode = HOP_STATION[hop] ?? crate.destination;
    await ctx.db.insert("events", { crateId: crate._id, hop, stationCode, scannedBy: who, note: text, ts: Date.now() });
    await ctx.db.patch(crate._id, { status: hop, currentStation: stationCode });
    return { id: crate._id, qrId: label, item: crate.item, hop };
  },
});

export const stats = signedInQuery({
  args: {},
  handler: async (ctx) => {
    const crates = await ctx.db.query("crates").collect();

    return {
      total: crates.length,
      inTransit: crates.filter((c) => c.status !== "station").length,
    };
  },
});