import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const withEmail = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("people").collect()).filter((p) => p.email),
});

/** Existing password account for this email, if any. */
export const userIdForEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", email))
      .first();
    return account?.userId ?? null;
  },
});

export const link = internalMutation({
  args: { personId: v.id("people"), userId: v.id("users") },
  handler: async (ctx, { personId, userId }) => {
    await ctx.db.patch(personId, { userId });
  },
});
