import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  stations: defineTable({
    code: v.string(),
    name: v.string(),
    lat: v.number(),
    lon: v.number(),
    type: v.string(),
  }).index("by_code", ["code"]),
  settings: defineTable({
    demoSpeed: v.number(),
    demoStartTs: v.number(),
  }),
});
