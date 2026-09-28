"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";

/**
 * One sign-in account per node (goa@, ship@, maitri@, bharati@, field@himsetu.demo).
 * The shared demo password comes from the DEMO_PASSWORD environment variable on the
 * Convex deployment, never from code. Re-running is safe: existing users are re-linked.
 */
export const provision = internalAction({
  args: {},
  handler: async (ctx) => {
    const password = process.env.DEMO_PASSWORD;
    if (!password) throw new Error("Set DEMO_PASSWORD on the Convex deployment first: npx convex env set DEMO_PASSWORD <value>");
    const people = await ctx.runQuery(internal.accountsDb.withEmail, {});
    const out = [];
    for (const p of people) {
      let userId = await ctx.runQuery(internal.accountsDb.userIdForEmail, { email: p.email });
      if (!userId) {
        const { user } = await createAccount(ctx, {
          provider: "password",
          account: { id: p.email, secret: password },
          profile: { email: p.email, name: p.name },
        });
        userId = user._id;
      }
      await ctx.runMutation(internal.accountsDb.link, { personId: p._id, userId });
      out.push(p.email);
    }
    return out;
  },
});
