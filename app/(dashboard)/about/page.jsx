import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";

const FEATURES = [
  ["Pass-aware sync scheduler", "SGP4 on live TLEs predicts Iridium/LEO windows; deltas batch and fire the moment a link opens."],
  ["On-device TimesFM-3", "INT8-quantised forecaster on the edge: multivariate burn-rates, no internet needed."],
  ["Sea-ice aware offload", "ISRO EOS-04 + Sentinel-1 ice maps choose berth, route and offload days."],
  ["Heli-slot planner", "Suggests weather-safe slots for the ship's two charter helicopters."],
  ["Encrypted messaging", "End-to-end encrypted 1:1, team or broadcast; SOS always sent first."],
  ["GNSS safety mesh", "LoRa + GNSS beacons, geofences and auto SAR with nearest-team ETA."],
];

const IMPACT = [
  ["Paper & spreadsheet manifests", "Scan-based chain of custody", "Any crate located in seconds; fewer lost, duplicate or wrongly shipped items."],
  ["Cloud tools need internet", "Pass-aware edge sync", "Millisecond local response; satellite airtime spent only when a link exists."],
  ["Manual hold loading", "Sea-ice + heli-slot planning", "Faster offload in the short ice-edge window; safer fuel and chemical handling."],
  ["Hand-counted stock", "On-device TimesFM-3", "Winter-over teams stay supplied; next season's orders based on measured use."],
  ["Radio call-ins for field teams", "GNSS safety mesh", "Faster emergency response; every person accounted for at all times."],
];

const CHALLENGES = [
  ["Extreme cold & power", "Cold-rated RFID + QR fallback; INT8 models, batched off-peak."],
  ["Unpredictable links", "Don't fight the link, predict it: SGP4 pass prediction + resumable CRDT deltas sized to each window."],
  ["New hardware & permits", "Software-first on existing links; LoRa gateways after EIA + permit under the Indian Antarctic Act 2022."],
];

const REFS = [
  "NCPOR: Indian Antarctic Programme (annual resupply by chartered ice-class ship with two helicopters)",
  "COMNAP: Antarctic safety guidelines for field tracking, SAR and medevac",
  "Indian Antarctic Act, 2022",
  "ISRO EOS-04 and Sentinel-1 SAR imagery",
  "NRSC AGEOS ground station at Bharati; CelesTrak TLEs",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About HIMSETU" subtitle="Edge-AI logistics that plans around satellites and ice." />
      <div className="grid gap-4">
        <Card>
          <CardTitle>The problem</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Each Indian Antarctic Expedition ships people, fuel, food and science kit to Maitri and Bharati in one
            short window a year. Paper manifests, hand-kept registers and slow satellite links mean one missed
            warning can leave a winter team short for months.
          </p>
        </Card>
        <Card>
          <CardTitle>The idea</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Every site keeps its own copy of the truth. NCPOR Goa, the ship, Maitri and Bharati each run HIMSETU
            locally, so work never stops when the link drops. Changes sync on their own over existing NCPOR/ISRO
            links, most urgent first. Planners in Goa see a live digital twin: every crate, fuel drum and person on
            one map, refreshed at each satellite pass.
          </p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <Card key={t}>
              <CardTitle>{t}</CardTitle>
              <p className="mt-2 text-sm text-slate-300">{d}</p>
            </Card>
          ))}
        </div>
        <Card>
          <CardTitle>Impact</CardTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-2 pr-4">Today</th><th className="py-2 pr-4">HIMSETU</th><th className="py-2">Benefit</th></tr>
              </thead>
              <tbody className="text-slate-300">
                {IMPACT.map(([a, b, c]) => (
                  <tr key={a} className="border-t border-navy-800">
                    <td className="py-2 pr-4">{a}</td><td className="py-2 pr-4 text-ice-300">{b}</td><td className="py-2">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardTitle>Challenges and how we handle them</CardTitle>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {CHALLENGES.map(([c, s]) => (
              <li key={c}><span className="font-medium text-slate-100">{c}:</span> {s}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Execution plan</CardTitle>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
            <li><b>Track:</b> QR/RFID custody at Goa and on the ship.</li>
            <li><b>Sync:</b> pass-aware nodes at Maitri and Bharati.</li>
            <li><b>Predict:</b> TimesFM-3, sea-ice routing, GNSS safety mesh.</li>
          </ol>
        </Card>
        <Card>
          <CardTitle>References</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {REFS.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Card>
        <p className="text-center text-xs text-slate-500">
          Prototype. Some data (crates, stock, ice imagery, positions) is simulated and labelled as such.
          Built by team Nako_Stop.
        </p>
      </div>
    </>
  );
}
