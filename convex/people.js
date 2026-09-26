import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("people").collect(),
});

export const byNode = query({
  args: { nodeCode: v.string() },
  handler: async (ctx, { nodeCode }) =>
    ctx.db.query("people").withIndex("by_node", (q) => q.eq("nodeCode", nodeCode)).first(),
});

/** Public half of the browser-generated keypair. The private key never leaves the device. */
export const registerKey = mutation({
  args: { personId: v.id("people"), publicKey: v.string() },
  handler: async (ctx, { personId, publicKey }) => {
    await ctx.db.patch(personId, { publicKey });
  },
});

export const teams = query({
  args: {},
  handler: async (ctx) => ctx.db.query("teams").collect(),
});
