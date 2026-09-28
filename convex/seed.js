import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./authz";
import { internal } from "./_generated/api";

// Everything below is SIMULATED demo data. Real deployments load manifests from NCPOR.

const STATIONS = [
  { code: "GOA", name: "NCPOR Goa Hub", lat: 15.4089, lon: 73.8467, type: "hub" },
  { code: "CPT", name: "Cape Town Port", lat: -33.9068, lon: 18.4233, type: "port" },
  { code: "SHIP", name: "Ice-class Ship", lat: -62.4, lon: 38.2, type: "ship" },
  { code: "MAITRI", name: "Maitri Station", lat: -70.7667, lon: 11.7333, type: "station" },
  { code: "BHARATI", name: "Bharati Station", lat: -69.4081, lon: 76.1878, type: "station" },
];

const PEOPLE = [
  { name: "Anjali Naik", role: "planner", stationCode: "GOA", nodeCode: "GOA", email: "goa@himsetu.demo" },
  { name: "Capt. Vikram Rao", role: "lead", stationCode: "SHIP", nodeCode: "SHIP", email: "ship@himsetu.demo" },
  { name: "Dr. Meera Iyer", role: "lead", stationCode: "MAITRI", nodeCode: "MAITRI", email: "maitri@himsetu.demo" },
  { name: "Rohit Bhatt", role: "lead", stationCode: "BHARATI", nodeCode: "BHARATI", email: "bharati@himsetu.demo" },
  { name: "Tenzin Negi", role: "field", stationCode: "MAITRI", nodeCode: "FIELD", email: "field@himsetu.demo" },
  { name: "Kavya Menon", role: "field", stationCode: "MAITRI", nodeCode: "" },
  { name: "Arjun Thapa", role: "field", stationCode: "MAITRI", nodeCode: "" },
  { name: "Sanjay Kulkarni", role: "field", stationCode: "BHARATI", nodeCode: "" },
];

const CRATES = [
  ["Diesel drum #201", 210, true, false, 1, "MAITRI", "station"],
  ["Diesel drum #202", 210, true, false, 1, "MAITRI", "helideck"],
  ["Diesel drum #203", 210, true, false, 1, "BHARATI", "ship_hold"],
  ["Frozen rations, lot A", 480, false, true, 2, "MAITRI", "ship_hold"],
  ["Frozen rations, lot B", 480, false, true, 2, "BHARATI", "ship_hold"],
  ["Medical kit, trauma", 35, false, false, 1, "MAITRI", "station"],
  ["Insulin + vaccines", 12, false, true, 1, "BHARATI", "port"],
  ["Generator spares", 140, false, false, 2, "BHARATI", "port"],
  ["AWS mast sensors", 60, false, false, 3, "MAITRI", "warehouse"],
  ["Ice-core drill head", 95, false, false, 2, "MAITRI", "ship_hold"],
  ["Lithium battery pack", 44, true, false, 2, "BHARATI", "warehouse"],
  ["Dry rations, 30 days", 320, false, false, 2, "MAITRI", "helideck"],
  ["Snow vehicle track set", 260, false, false, 3, "BHARATI", "ship_hold"],
  ["Seismometer (broadband)", 70, false, false, 3, "BHARATI", "port"],
  ["Propane cylinders x6", 180, true, false, 2, "MAITRI", "port"],
  ["Water purification unit", 110, false, false, 2, "BHARATI", "warehouse"],
];

const HOPS = ["warehouse", "port", "ship_hold", "helideck", "station"];
const HOP_STATION = { warehouse: "GOA", port: "CPT", ship_hold: "SHIP", helideck: "SHIP", station: null };
const SCANNERS = { warehouse: "Anjali Naik", port: "Port agent, CPT", ship_hold: "Capt. Vikram Rao", helideck: "Deck crew", station: null };

const INVENTORY = {
  diesel: { unit: "L", daily: 900, qty: 64000, safety: 15000 },
  food: { unit: "kg", daily: 38, qty: 3600, safety: 900 },
  medical: { unit: "kits", daily: 0.6, qty: 70, safety: 20 },
  spares: { unit: "units", daily: 1.4, qty: 210, safety: 40 },
};

const DAY = 86400000;

/** From the UI: planners only. From the CLI use `npx convex run seed:resetAll`. */
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "demo.control");
    await ctx.runMutation(internal.seed.resetAll, {});
    return "reset";
  },
});

export const resetAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const t of ["stations", "people", "teams", "crates", "events", "inventory", "consumption", "forecasts", "passes", "messages", "linkWindows", "alerts", "settings"]) {
      for (const row of await ctx.db.query(t).collect()) await ctx.db.delete(row._id);
    }
    await ctx.runMutation(internal.seed.seedAll, {});
    return "reset";
  },
});

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("stations").first()) return "already seeded";
    const now = Date.now();
    await ctx.db.insert("settings", { demoSpeed: 60, demoStartTs: now });

    for (const s of STATIONS) await ctx.db.insert("stations", s);
    const ids = [];
    for (const p of PEOPLE) ids.push(await ctx.db.insert("people", p));

    // Field teams near Maitri (Schirmacher Oasis) and Bharati (Larsemann Hills).
    await ctx.db.insert("teams", {
      name: "Glacier Team Alpha", stationCode: "MAITRI", kind: "foot", memberIds: [ids[4], ids[5]],
      lat: -70.84, lon: 11.52, geofence: { lat: -70.77, lon: 11.73, radiusKm: 25 },
      checkInEveryMin: 60, lastCheckIn: now,
    });
    await ctx.db.insert("teams", {
      name: "Oasis Survey Bravo", stationCode: "MAITRI", kind: "foot", memberIds: [ids[6]],
      lat: -70.74, lon: 11.95, geofence: { lat: -70.77, lon: 11.73, radiusKm: 25 },
      checkInEveryMin: 60, lastCheckIn: now,
    });
    await ctx.db.insert("teams", {
      name: "Snow Vehicle PB-2", stationCode: "MAITRI", kind: "vehicle", memberIds: [],
      lat: -70.70, lon: 11.40, geofence: { lat: -70.77, lon: 11.73, radiusKm: 40 },
      checkInEveryMin: 120, lastCheckIn: now,
    });
    await ctx.db.insert("teams", {
      name: "Larsemann Traverse", stationCode: "BHARATI", kind: "vehicle", memberIds: [ids[7]],
      lat: -69.45, lon: 76.05, geofence: { lat: -69.41, lon: 76.19, radiusKm: 30 },
      checkInEveryMin: 90, lastCheckIn: now,
    });

    // Crates with a plausible custody trail up to their current hop.
    for (let i = 0; i < CRATES.length; i++) {
      const [item, weightKg, hazmat, coldChain, priority, destination, lastHop] = CRATES[i];
      const upto = HOPS.indexOf(lastHop);
      const start = now - (upto + 1) * 6 * DAY - i * 3600000;
      const crateId = await ctx.db.insert("crates", {
        qrId: `HMS-${String(1001 + i)}`,
        item, weightKg, hazmat, coldChain, priority, destination,
        status: lastHop,
        currentStation: HOP_STATION[lastHop] ?? destination,
        createdAt: start,
      });
      for (let h = 0; h <= upto; h++) {
        const hop = HOPS[h];
        await ctx.db.insert("events", {
          crateId, hop,
          stationCode: HOP_STATION[hop] ?? destination,
          scannedBy: SCANNERS[hop] ?? (destination === "MAITRI" ? "Dr. Meera Iyer" : "Rohit Bhatt"),
          ts: start + h * 6 * DAY,
        });
      }
    }

    // 60 days of consumption: weekly rhythm + a cold snap 18 to 12 days ago.
    for (const stationCode of ["MAITRI", "BHARATI"]) {
      const scale = stationCode === "MAITRI" ? 1 : 0.8;
      for (const [item, cfg] of Object.entries(INVENTORY)) {
        await ctx.db.insert("inventory", {
          stationCode, item, unit: cfg.unit,
          qty: Math.round(cfg.qty * scale), safetyLevel: Math.round(cfg.safety * scale),
        });
        for (let d = 60; d >= 1; d--) {
          const date = Math.floor((now - d * DAY) / DAY) * DAY;
          const weekday = new Date(date).getUTCDay();
          const weekly = weekday === 0 ? 0.8 : weekday === 6 ? 0.9 : 1.05;
          const coldSnap = d <= 18 && d >= 12 && item === "diesel" ? 1.45 : 1;
          const noise = 1 + (Math.sin(d * 12.9898 + item.length) * 43758.5453 % 1) * 0.12;
          await ctx.db.insert("consumption", {
            stationCode, item, date,
            qty: +(cfg.daily * scale * weekly * coldSnap * noise).toFixed(2),
          });
        }
      }
    }
    await ctx.scheduler.runAfter(0, internal.orbits.refresh, {});
    // Create (or re-link) the sign-in accounts for everyone with an email.
    await ctx.scheduler.runAfter(0, internal.accounts.provision, {});
    return "seeded";
  },
});
