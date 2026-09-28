import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { can, ROLE_LABEL } from "../lib/rbac";

/** The expedition member behind the signed-in account, or null. */
export async function currentPerson(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return ctx.db.query("people").withIndex("by_user", (q) => q.eq("userId", userId)).first();
}

/** Throws unless someone is signed in. Returns their person row. */
export async function requireSignedIn(ctx) {
  const me = await currentPerson(ctx);
  if (!me) throw new Error("Please sign in.");
  return me;
}

/**
 * Refuse unless the signed-in person's role holds `perm`.
 * Every public mutation that changes shared state goes through this.
 */
export async function requirePermission(ctx, perm) {
  const me = await requireSignedIn(ctx);
  if (!can(me.role, perm)) {
    throw new Error(`${ROLE_LABEL[me.role] ?? me.role} is not allowed to do this (${perm}).`);
  }
  return me;
}

/** Refuse if a client claims to act as someone other than the signed-in person. */
export async function requireSelf(ctx, personId) {
  const me = await requireSignedIn(ctx);
  if (me._id !== personId) throw new Error("You can only act as yourself.");
  return me;
}

/** A query that only answers signed-in users. Drop-in for `query({...})`. */
export function signedInQuery({ args, handler }) {
  return query({
    args,
    handler: async (ctx, a) => {
      await requireSignedIn(ctx);
      return handler(ctx, a);
    },
  });
}
