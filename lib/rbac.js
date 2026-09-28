/**
 * Role-based access control, shared by Convex (enforcement) and the UI (what to show).
 *
 *   planner  NCPOR Goa hub: full control of cargo, the demo and the link
 *   lead     station / ship lead: scans handovers, answers SOS and alerts at the station
 *   field    field team on a phone: SOS, check-ins, messages to stations and teams
 *
 * Prototype note: identity is the "Logged in as" node, not a real login. The checks
 * are real (the server refuses), but anyone can pick any node in the switcher.
 */
export const ROLE_LABEL = { planner: "Planner (Goa)", lead: "Station lead", field: "Field team" };

export const PERMISSIONS = {
  "crate.create": ["planner"],
  "crate.scan": ["planner", "lead"],
  "sos.acknowledge": ["planner", "lead"],
  "alert.resolve": ["planner", "lead"],
  "message.broadcast": ["planner", "lead"],
  "field.report": ["field", "lead"],
  "demo.control": ["planner"],
};

/** @param {string | undefined} role  @param {keyof PERMISSIONS} perm */
export function can(role, perm) {
  return Boolean(role && PERMISSIONS[perm]?.includes(role));
}
