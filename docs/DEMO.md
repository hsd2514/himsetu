# Demo script (about 3 minutes)

Two screens: a **laptop** on the projector and a **phone** for the field team.

## Before you start (5 minutes ahead)

1. Laptop: open `/`, log in as **NCPOR Goa Hub**, press **Reset demo**. Check the banner is empty and the teams read "On time".
2. Make sure **Demo speed 60×** is on.
3. Phone: open https://himsetu.vercel.app/field. It logs in as the Maitri field team. Leave it open once so its encryption key registers.
4. Laptop: switch through **Ice-class Ship**, **Maitri Station** and **Bharati Station** once and back to **Goa**, so every stakeholder has a key and can read the SOS.
5. Pick Light or Dark (sidebar, bottom).

## The run

| # | Say | Do |
|---|---|---|
| 1 | "Every crate is tagged in Goa." | **Cargo → New crate**: `Diesel drum #214`, 210 kg, Maitri, urgent, hazmat. **Create and print label**. |
| 2 | "Each handover is a scan." | Phone: switch to **Ice-class Ship** (field teams cannot scan cargo), **Cargo → Scan**, point at the label, choose **Cape Town port**, log it. Then again with **Ship hold**. On the laptop the crate's timeline fills in live. Custody only moves forward, so scan in order. Switch the phone back to **Field Team (Maitri)**. |
| 3 | "We see shortages months ahead." | **Inventory**: the headline reads "Diesel at Maitri hits its safety level on …". Point at measured stock, the Holt-Winters forecast and the safety line. If TimesFM output was imported, its line is there too. |
| 4 | "A field team is in trouble." | Phone: press **SOS**. It is addressed to every stakeholder (Goa, ship, both station leads) and waits at the front of the link. |
| 5 | "There is no link right now." | Laptop, Mission page: the **Maitri link** countdown and the **Link queue** show the SOS waiting, first in line. |
| 6 | "The satellite rises…" | When the countdown ends the card turns green, the SOS goes out, and Goa gets the red **SOS** panel: decrypted text, GPS, and the nearest teams with ETA on the map. |
| 7 | "Goa answers." | Press **Acknowledge and reply**. The reply is encrypted and queued for Maitri's next pass; the alert closes. |
| 8 | "Where do we offload?" | **Sea ice**: the suggested berth with its score, and the next fly-safe helicopter window. |

## Optional extras

- **Missed check-in:** Mission → Field teams → **Simulate missed** on any team. The amber alert appears straight away. A check-in from the phone clears it.
- **Offline phone:** put the phone in airplane mode, press **Safe**. It is saved on the phone with the time it happened, and sends by itself when the network returns.
- **Hindi:** the EN / हिं switch at the top of the sidebar.

## If something goes wrong

- **Passes look stale:** Mission → **Refresh passes**.
- **"No recipient has registered an encryption key":** open the app once as the recipient node on that device.
- **Too many alerts from earlier:** **Reset demo** (planner only), or `npx convex run --prod seed:resetAll`.

## Roles

| Node | Role | Can |
|---|---|---|
| NCPOR Goa Hub | Planner | everything, including New crate, Reset demo, demo speed, Refresh passes, Simulate missed |
| Ship, Maitri, Bharati | Station lead | scan handovers, acknowledge SOS, resolve alerts, broadcast |
| Field Team (Maitri) | Field team | SOS, check-ins, messages to stakeholders, stations and teams |
