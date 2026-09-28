import { can, ROLE_LABEL } from "../lib/rbac";

/**
 * Load the acting person and refuse unless their role holds `perm`.
 * Every public mutation that changes shared state goes through this.
 */
export async function requirePermission(ctx, actorId, perm) {
  const actor = actorId ? await ctx.db.get(actorId) : null;
  if (!actor) throw new Error("Unknown user. Pick who you are in the sidebar.");
  if (!can(actor.role, perm)) {
    throw new Error(`${ROLE_LABEL[actor.role] ?? actor.role} is not allowed to do this (${perm}).`);
  }
  return actor;
}
