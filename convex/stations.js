import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("stations").collect(),
});

/** Seed demo data if the database is empty. */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("stations").first()) return "already seeded";
    await ctx.runMutation(internal.seed.seedAll, {});
    return "seeded";
  },
});
