import { query, mutation, internalQuery } from "./_generated/server";
import { currentPerson, requirePermission, requireSelf, signedInQuery } from "./authz";
import { v } from "convex/values";

export const list = signedInQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("people").collect(),
});

export const byNode = signedInQuery({
  args: { nodeCode: v.string() },
  handler: async (ctx, { nodeCode }) =>
    ctx.db.query("people").withIndex("by_node", (q) => q.eq("nodeCode", nodeCode)).first(),
});

/** Public half of the browser-generated keypair. The private key never leaves the device. */
export const registerKey = mutation({
  args: { personId: v.id("people"), publicKey: v.string() },
  handler: async (ctx, { personId, publicKey }) => {
    await requireSelf(ctx, personId);
    await ctx.db.patch(personId, { publicKey });
  },
});

export const teams = signedInQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("teams").collect(),
});

/** Permission check for actions, which cannot read the database directly. */
export const assertCan = internalQuery({
  args: { perm: v.string() },
  handler: async (ctx, { perm }) => {
    await requirePermission(ctx, perm);
  },
});

/** The signed-in expedition member (null when signed out). */
export const me = query({
  args: {},
  handler: async (ctx) => currentPerson(ctx),
});
