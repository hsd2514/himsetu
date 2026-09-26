# HIMSETU — Build Plan

HIMSETU (हिमसेतु, "bridge to the ice") is a prototype Integrated Polar Expedition Logistics and Asset Management System for NCPOR / MoES.

Indian Antarctic expeditions ship people, fuel, food and science kit from NCPOR Goa → Cape Town → ice-class ship → Maitri & Bharati in one short window a year. Satellite links are slow and intermittent. HIMSETU gives every site its own copy of the data and syncs only when a satellite is overhead, most urgent first.

Hackathon demo, not production: works end-to-end, looks polished, one-command deploy, 3-minute live demo. Faking data is fine, but label simulated data in the UI.

## Rules
- Never write any problem-statement ID, hackathon PS number or team ID anywhere in the repo, UI, commits or issues.
- Stack: Next.js 15 App Router, plain JavaScript; Convex for DB/realtime/scheduler/crons; Tailwind + shadcn-style components + lucide-react; react-leaflet; Recharts; satellite.js; libsodium-wrappers; qrcode + html5-qrcode; Open-Meteo; EN/Hindi toggle.
- No Docker, no separate backend server, no Python in the app. TimesFM-3 runs offline in `notebooks/timesfm_forecast.ipynb`; its JSON is imported. Live JS Holt-Winters fallback.
- All times stored as UTC ms; IST for Goa, UTC for Antarctica.
- Convex validators on every mutation. Small files. Small commits.
- Deploy: Vercel (frontend) + `npx convex deploy`.

## Phases (tracked as GitHub issues on hsd2514/himsetu)
0. Setup: app shell, station switcher
1. Data & cargo: schema, seed, cargo create/scan/timeline, map, inventory
2. Satellites & link: SGP4 pass predictor, crons, countdown, pass-gated link simulator, demo mode
3. Secure comms & safety: E2E encryption, messages, field SOS, check-ins, SAR, alerts
4. Forecast & ice: Holt-Winters + TimesFM import, charts, sea ice overlay, heli slots, Goa KPIs
5. Polish & ship: Hindi toggle, README, demo script, production deploy

## Demo script
1. Goa: create crate "Diesel drum #214", print QR.
2. Scan at port, then ship_hold; timeline updates live.
3. Inventory: "Diesel at Maitri runs out on 14 Aug" (TimesFM vs actual).
4. Phone `/field` as Maitri field team → SOS.
5. Maitri: message queued, "Next Iridium pass in 00:48".
6. Pass arrives → sent via satellite → Goa receives encrypted SOS with GPS and nearest-team ETA.
7. Sea ice: suggested berth + next fly-safe heli slot.
