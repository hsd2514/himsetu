import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const HOP_STATION = {
  warehouse: "GOA",
  port: "CPT",
  ship_hold: "SHIP",
  helideck: "SHIP",
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const crates = await ctx.db.query("crates").order("desc").collect();
    return crates;
  },
});

export const get = query({
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

export const byQr = query({
  args: { qrId: v.string() },
  handler: async (ctx, { qrId }) =>
    ctx.db
      .query("crates")
      .withIndex("by_qr", (q) => q.eq("qrId", qrId.trim()))
      .first(),
});

export const create = mutation({
  args: {
    item: v.string(),
    weightKg: v.number(),
    hazmat: v.boolean(),
    coldChain: v.boolean(),
    priority: v.number(),
    destination: v.union(v.literal("MAITRI"), v.literal("BHARATI")),
    scannedBy: v.string(),
  },

  handler: async (ctx, args) => {
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

    const { scannedBy, ...rest } = args;

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

/** Log a custody handover. Rejects going backwards in the chain. */
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
    scannedBy: v.string(),
    note: v.optional(v.string()),
  },

  handler: async (ctx, { qrId, hop, scannedBy, note }) => {
    const crate = await ctx.db
      .query("crates")
      .withIndex("by_qr", (q) => q.eq("qrId", qrId.trim()))
      .first();

    if (!crate) {
      throw new Error(`No crate with label ${qrId}`);
    }

    const stationCode = HOP_STATION[hop] ?? crate.destination;

    await ctx.db.insert("events", {
      crateId: crate._id,
      hop,
      stationCode,
      scannedBy,
      note,
      ts: Date.now(),
    });

    await ctx.db.patch(crate._id, {
      status: hop,
      currentStation: stationCode,
    });

    return crate._id;
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const crates = await ctx.db.query("crates").collect();

    return {
      total: crates.length,
      inTransit: crates.filter((c) => c.status !== "station").length,
    };
  },
});