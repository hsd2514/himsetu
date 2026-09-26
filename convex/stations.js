import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("stations").collect(),
});

/** Seed the five nodes of the resupply chain. Idempotent. */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("stations").first();
    if (existing) return "already seeded";
    const rows = [
      { code: "GOA", name: "NCPOR Goa Hub", lat: 15.4089, lon: 73.8467, type: "hub" },
      { code: "CPT", name: "Cape Town Port", lat: -33.9068, lon: 18.4233, type: "port" },
      { code: "SHIP", name: "Ice-class Ship", lat: -55.2, lon: 45.0, type: "ship" },
      { code: "MAITRI", name: "Maitri Station", lat: -70.7667, lon: 11.7333, type: "station" },
      { code: "BHARATI", name: "Bharati Station", lat: -69.4081, lon: 76.1878, type: "station" },
    ];
    for (const r of rows) await ctx.db.insert("stations", r);
    return "seeded";
  },
});
