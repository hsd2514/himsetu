import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const station = v.union(
  v.literal("GOA"),
  v.literal("CPT"),
  v.literal("SHIP"),
  v.literal("MAITRI"),
  v.literal("BHARATI")
);
const priority = v.union(v.literal("sos"), v.literal("medical"), v.literal("ops"), v.literal("normal"));

export default defineSchema({
  ...authTables,

  stations: defineTable({
    code: v.string(),
    name: v.string(),
    lat: v.number(),
    lon: v.number(),
    type: v.string(),
  }).index("by_code", ["code"]),

  people: defineTable({
    name: v.string(),
    role: v.union(v.literal("planner"), v.literal("lead"), v.literal("field")),
    stationCode: station,
    nodeCode: v.string(), // which node this person works from (GOA, SHIP, MAITRI, BHARATI, FIELD)
    email: v.optional(v.string()), // sign-in email for people with an account
    userId: v.optional(v.id("users")), // linked Convex Auth user
    publicKey: v.optional(v.string()),
    lastLat: v.optional(v.number()),
    lastLon: v.optional(v.number()),
    lastSeen: v.optional(v.number()),
  })
    .index("by_node", ["nodeCode"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_station", ["stationCode"]),

  teams: defineTable({
    name: v.string(),
    stationCode: station,
    kind: v.union(v.literal("foot"), v.literal("vehicle")),
    memberIds: v.array(v.id("people")),
    lat: v.number(),
    lon: v.number(),
    geofence: v.object({ lat: v.number(), lon: v.number(), radiusKm: v.number() }),
    checkInEveryMin: v.number(),
    lastCheckIn: v.number(),
  }).index("by_station", ["stationCode"]),

  crates: defineTable({
    qrId: v.string(),
    item: v.string(),
    weightKg: v.number(),
    hazmat: v.boolean(),
    coldChain: v.boolean(),
    priority: v.number(), // 1 urgent, 3 routine
    status: v.string(), // last hop
    currentStation: station,
    destination: station,
    createdAt: v.number(),
  })
    .index("by_qr", ["qrId"])
    .index("by_status", ["status"]),

  events: defineTable({
    crateId: v.id("crates"),
    hop: v.union(
      v.literal("warehouse"),
      v.literal("port"),
      v.literal("ship_hold"),
      v.literal("helideck"),
      v.literal("station")
    ),
    stationCode: station,
    scannedBy: v.string(),
    note: v.optional(v.string()),
    ts: v.number(),
  }).index("by_crate", ["crateId", "ts"]),

  inventory: defineTable({
    stationCode: station,
    item: v.string(),
    qty: v.number(),
    unit: v.string(),
    safetyLevel: v.number(),
  }).index("by_station", ["stationCode"]),

  consumption: defineTable({
    stationCode: station,
    item: v.string(),
    date: v.number(),
    qty: v.number(),
  }).index("by_station_item", ["stationCode", "item", "date"]),

  forecasts: defineTable({
    stationCode: station,
    item: v.string(),
    source: v.union(v.literal("timesfm"), v.literal("holtwinters")),
    points: v.array(v.object({ date: v.number(), qty: v.number() })),
    stockOutDate: v.optional(v.number()),
  }).index("by_station_item", ["stationCode", "item"]),

  tles: defineTable({
    source: v.string(), // "celestrak" | "bundled"
    text: v.string(),
    fetchedAt: v.number(),
  }),

  passes: defineTable({
    stationCode: station,
    satName: v.string(),
    aos: v.number(), // virtual (mission) time, UTC ms
    los: v.number(),
    maxElevDeg: v.number(),
  }).index("by_station_aos", ["stationCode", "aos"]),

  messages: defineTable({
    fromId: v.id("people"),
    fromStation: station,
    toType: v.union(v.literal("user"), v.literal("team"), v.literal("station"), v.literal("stakeholders"), v.literal("broadcast")),
    toId: v.string(),
    recipientIds: v.array(v.id("people")),
    priority,
    ciphertext: v.string(),
    nonce: v.string(),
    keys: v.array(v.object({ personId: v.id("people"), sealed: v.string() })),
    bytes: v.number(),
    gateStation: v.optional(station), // remote end whose satellite pass gates this message
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("delivered"), v.literal("read")),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    queuedAt: v.number(),
    releaseAt: v.optional(v.number()), // real time the next window opens
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    attempts: v.number(),
    readBy: v.optional(v.array(v.id("people"))), // recipients who opened it
    ackAt: v.optional(v.number()), // SOS acknowledged at Goa
    ackBy: v.optional(v.id("people")),
  })
    .index("by_gate_status", ["gateStation", "status"])
    .index("by_status", ["status"]),

  linkWindows: defineTable({
    stationCode: station,
    passId: v.id("passes"),
    releaseAt: v.number(),
  }).index("by_station", ["stationCode"]),

  alerts: defineTable({
    type: v.union(v.literal("sos"), v.literal("missed_checkin"), v.literal("stockout"), v.literal("weather")),
    severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("info")),
    stationCode: station,
    refId: v.optional(v.string()),
    text: v.string(),
    ts: v.number(),
    resolved: v.boolean(),
  }).index("by_resolved", ["resolved"]),

  settings: defineTable({
    demoSpeed: v.number(), // 1 = real time, 60 = one real second is one mission minute
    demoStartTs: v.number(),
  }),

  // Persistent monotonic counters — never reset on row deletion.
  counters: defineTable({
    name: v.string(),   // e.g. "crate_seq"
    value: v.number(),  // current sequence value (1-based)
  }).index("by_name", ["name"]),
});
