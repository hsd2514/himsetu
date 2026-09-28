# HIMSETU

हिमसेतु, "bridge to the ice". A prototype logistics and asset system for the Indian Antarctic Programme (NCPOR / MoES).

Every resupply season moves people, fuel, food and science kit from NCPOR Goa to Cape Town, onto an ice-class ship, and on to Maitri and Bharati. Satellite links are slow and come and go. HIMSETU gives every site its own copy of the data and syncs only when a satellite is overhead, most urgent first.

**Live:** https://himsetu.vercel.app (Field page for phones: https://himsetu.vercel.app/field)

> Prototype for a hackathon demo. Some data is simulated and is labelled as simulated in the UI (see [What is real and what is simulated](#what-is-real-and-what-is-simulated)).

## What it does

| Screen | What you can do |
|---|---|
| **Mission** `/` | KPIs, live satellite link countdowns per node, the latest SOS with nearest responders, field team check-ins, resupply map, link queue and the next satellite windows |
| **Cargo** `/cargo` | Search and filter crates, create a crate and print its QR label, scan handovers with a phone camera, see the chain of custody |
| **Inventory** `/inventory` | Stock per station, Holt-Winters burn-down to the safety level, TimesFM-3 line when imported |
| **Messages** `/messages` | End-to-end encrypted 1:1, team, station and broadcast messages, queued until the next pass |
| **Field** `/field` | Phone page for field teams: SOS, Safe / Delayed / Need help, GPS, offline outbox |
| **Sea ice** `/ice` | Sea-ice overlay, ranked candidate berths, fly-safe helicopter slots for the next 72 h |

Also: English / हिन्दी toggle, light and dark mode, role-based access, installable PWA for the field page.

## How it works

```
Browser (Next.js 15, JS)                     Convex (DB, realtime, scheduler, crons)
 ├─ libsodium: keys + encryption on device    ├─ messages.send ─▶ queued, gated by a satellite pass
 ├─ Leaflet maps, Recharts                    ├─ link.releaseWindow at AOS: SOS > medical > ops > normal
 └─ html5-qrcode camera scanning              ├─ orbits.refresh: CelesTrak TLEs + SGP4 (satellite.js)
                                              ├─ forecast: Holt-Winters live, TimesFM-3 import
                                              ├─ weather.heliSlots: Open-Meteo
                                              └─ crons: TLE refresh (6 h), pass horizon, missed check-ins
```

- **Pass-gated link.** A message that touches a remote node (ship, Maitri, Bharati, field) waits for that node's next Iridium pass. At AOS the scheduler releases up to 4 messages, most urgent first, 340 bytes each. 5% are randomly dropped and retried on the next pass. Goa to Goa is instant.
- **Demo speed.** At 60× one real second is one mission minute, so a pass 48 minutes away arrives in 48 seconds. Toggle it on the Mission page.
- **Encryption.** Each device makes a libsodium keypair; the public key goes to Convex, the private key stays in the browser. Every message gets a fresh key, sealed to each recipient. The server only stores ciphertext.
- **Sign-in.** Convex Auth with email + password. One account per node: `goa@`, `ship@`, `maitri@`, `bharati@` and `field@himsetu.demo`. Accounts are created by the seed (`convex/accounts.js`); public sign-up is closed. The shared demo password is the `DEMO_PASSWORD` environment variable on the Convex deployment (locally it is also in the gitignored `.env.demo`). Every query needs a signed-in user, except the TimesFM history export and the sign-in page's demo credentials. The sign-in page shows the test login while `SHOW_DEMO_PASSWORD=1` is set on the deployment; `npx convex env remove --prod SHOW_DEMO_PASSWORD` hides it.
- **Roles (RBAC).** Planner (Goa), station lead (ship, Maitri, Bharati) and field team. Permissions live in `lib/rbac.js`; every protected Convex mutation checks the signed-in person's role through `convex/authz.js`, and the UI hides what a role cannot do. Nothing trusts an ID sent by the browser.
- **Stakeholder messaging.** SOS and field check-ins go to every stakeholder (Goa planner, ship and station leads). Messages are never deleted; each sender sees delivery and "read by n of m".
- **SAR.** Nearest teams by great-circle distance, ETA at 8 km/h on foot and 20 km/h by snow vehicle.

## Run it locally

Needs Node 20+.

```bash
npm install
npx convex dev --once                                   # creates the dev deployment and .env.local
node scripts/set-auth-env.mjs --site=http://localhost:3000  # sign-in keys + DEMO_PASSWORD (saved to .env.demo)
npx convex run seed:resetAll                            # demo data + the five accounts
npm run dev                                             # http://localhost:3000, sign in with any demo account
```

**On a phone** (camera scanning needs HTTPS):

```bash
npm run dev:phone       # https://<your-laptop-ip>:3000, accept the self-signed certificate
```

**TimesFM-3 forecast** (optional, runs outside the app):

```bash
npm run forecast:export   # writes notebooks/history.json from Convex
# run notebooks/timesfm_forecast.ipynb in Colab, download its output JSON
npm run forecast:import -- timesfm_forecast.json   # loads it into the forecasts table (CONVEX_RUN_FLAGS=--prod for production)
```

**Regenerate PWA icons:** `node scripts/make-icons.mjs`.

## Deploy

- Backend: `npx convex deploy` (needs `npx convex login` once). First time on a new deployment: `node scripts/set-auth-env.mjs --prod --site=https://himsetu.vercel.app`, then `npx convex run --prod seed:resetAll`. The team can read the password with `npx convex env get --prod DEMO_PASSWORD`.
- Frontend: `npx vercel@latest deploy --prod` (project `himsetu`, env `NEXT_PUBLIC_CONVEX_URL` already set on Vercel).
- After a schema or function change, run `npx convex deploy` before the frontend deploy.

No Docker and no separate server.

## What is real and what is simulated

| Real | Simulated |
|---|---|
| Iridium NEXT orbits from CelesTrak TLEs, propagated with SGP4 | Each node gets 3 satellites, so link windows are spaced out for the demo |
| Encryption (libsodium sealed boxes) | Crates, stock levels and 60 days of consumption |
| Open-Meteo hourly wind, gusts and visibility | Field team positions; the field page uses a fixed Maitri position unless real GPS is in Antarctica |
| NASA GIBS AMSR2 sea-ice concentration (latest published: 2025-09-01) | Berth ice figures, standing in for processed ISRO EOS-04 / Sentinel-1 SAR |
| Holt-Winters forecast on the seeded consumption | |

## Project layout

```
app/(dashboard)/   pages: mission, cargo, inventory, messages, field, ice, about
components/        UI, maps, charts, theme and language providers
convex/            schema, seed, crates, passes + orbits, link, messages, sos, forecast, weather, crons
lib/               crypto, Holt-Winters, time, i18n, outbox, ice berths
notebooks/         TimesFM-3 Colab notebook
scripts/           TimesFM export/import, icon generator
```

See [docs/DEMO.md](docs/DEMO.md) for the 3-minute demo script.
