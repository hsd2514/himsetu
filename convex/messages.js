import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureWindow } from "./link";

export const MAX_BYTES = 340;

const priority = v.union(v.literal("sos"), v.literal("medical"), v.literal("ops"), v.literal("normal"));

/** Resolve who a message is for. Team = its members, station = everyone there, broadcast = all. */
async function resolveRecipients(ctx, toType, toId, fromId) {
  const people = await ctx.db.query("people").collect();
  if (toType === "user") return people.filter((p) => p._id === toId);
  if (toType === "station") return people.filter((p) => p.stationCode === toId && p._id !== fromId);
  if (toType === "team") {
    const team = await ctx.db.get(toId);
    return people.filter((p) => team?.memberIds.includes(p._id) && p._id !== fromId);
  }
  return people.filter((p) => p._id !== fromId);
}

/** Recipients and their public keys, so the browser can seal before sending. */
export const recipients = query({
  args: { toType: v.string(), toId: v.string(), fromId: v.id("people") },
  handler: async (ctx, { toType, toId, fromId }) => {
    const list = await resolveRecipients(ctx, toType, toId, fromId);
    return list.map((p) => ({ _id: p._id, name: p.name, stationCode: p.stationCode, publicKey: p.publicKey ?? null }));
  },
});

export const send = mutation({
  args: {
    fromId: v.id("people"),
    toType: v.union(v.literal("user"), v.literal("team"), v.literal("station"), v.literal("broadcast")),
    toId: v.string(),
    priority,
    ciphertext: v.string(),
    nonce: v.string(),
    keys: v.array(v.object({ personId: v.id("people"), sealed: v.string() })),
    bytes: v.number(),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.bytes > MAX_BYTES) throw new Error(`Message is ${args.bytes} bytes; the satellite limit is ${MAX_BYTES}.`);
    const from = await ctx.db.get(args.fromId);
    if (!from) throw new Error("Unknown sender");
    const recipients = await resolveRecipients(ctx, args.toType, args.toId, args.fromId);
    const now = Date.now();

    // The remote end of the conversation decides which satellite window gates it.
    const remote = from.stationCode !== "GOA" ? from.stationCode : recipients.find((r) => r.stationCode !== "GOA")?.stationCode;
    const base = {
      ...args,
      fromStation: from.stationCode,
      recipientIds: recipients.map((r) => r._id),
      queuedAt: now,
      attempts: 0,
    };
    if (!remote) {
      // Goa to Goa rides the hub's fibre: instant.
      return ctx.db.insert("messages", { ...base, status: "delivered", sentAt: now, deliveredAt: now });
    }
    if (args.lat !== undefined) await ctx.db.patch(from._id, { lastLat: args.lat, lastLon: args.lon, lastSeen: now });
    const id = await ctx.db.insert("messages", { ...base, gateStation: remote, status: "queued" });
    const releaseAt = await ensureWindow(ctx, remote);
    if (releaseAt) await ctx.db.patch(id, { releaseAt });
    return id;
  },
});

/** Inbox + outbox for one person, newest first. */
export const forPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const all = await ctx.db.query("messages").order("desc").take(200);
    const people = await ctx.db.query("people").collect();
    const name = (id) => people.find((p) => p._id === id)?.name ?? "Unknown";
    return all
      .filter((m) => m.fromId === personId || (m.recipientIds.includes(personId) && m.status !== "queued" && m.status !== "sent"))
      .map((m) => ({ ...m, fromName: name(m.fromId), outgoing: m.fromId === personId }));
  },
});

export const markRead = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    const m = await ctx.db.get(id);
    if (m?.status === "delivered") await ctx.db.patch(id, { status: "read" });
  },
});

/** Queue as seen by the link: what is waiting, in release order. */
export const queue = query({
  args: {},
  handler: async (ctx) => {
    const rank = { sos: 0, medical: 1, ops: 2, normal: 3 };
    const q = await ctx.db.query("messages").withIndex("by_status", (x) => x.eq("status", "queued")).collect();
    return q.sort((a, b) => rank[a.priority] - rank[b.priority] || a.queuedAt - b.queuedAt);
  },
});
