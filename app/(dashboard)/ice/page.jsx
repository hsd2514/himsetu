"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAction, useQuery } from "convex/react";
import { Anchor, Plane, RefreshCw, Wind } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { ICE_DATE, rankBerths } from "@/lib/ice";
import { fmtTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const IceMap = dynamic(() => import("@/components/ice-map-inner"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-navy-900" />,
});

function HeliSlots({ stationCode }) {
  const fetchSlots = useAction(api.weather.heliSlots);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setData(await fetchSlots({ stationCode }));
    } catch (e) {
      setError("Could not reach Open-Meteo. Check the connection and retry.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationCode]);

  const next = data?.slots.find((s) => s.to > Date.now());

  return (
    <Card className="grid content-start gap-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Plane size={14} /> Helicopter slots, next 72 h</CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={busy} aria-label="Refresh forecast">
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        </Button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!data && !error && <div className="h-40 animate-pulse rounded-lg bg-navy-800" />}
      {data && (
        <>
          {next ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
              <div className="text-xs text-emerald-300">Next fly-safe window</div>
              <div className="mt-1 font-mono text-lg text-slate-100">
                {fmtTime(next.from, stationCode)}, {Math.round((next.to - next.from) / 3600000)} h
              </div>
              <div className="text-xs text-slate-400">
                wind ≤ {Math.round(next.maxWind)} kt, gusts ≤ {Math.round(next.maxGust)} kt, visibility ≥ {next.minVisKm.toFixed(0)} km
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-navy-800 p-3 text-sm text-slate-300">No fly-safe window in the next 72 hours. Hold sorties.</p>
          )}
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-slate-400">
              <span>Now</span><span>+24 h</span><span>+48 h</span><span>+72 h</span>
            </div>
            <div className="flex h-6 gap-px overflow-hidden rounded-md" role="img" aria-label="Hourly fly-safe forecast">
              {data.hours.map((h) => (
                <span
                  key={h.ts}
                  title={`${fmtTime(h.ts, stationCode)}: wind ${Math.round(h.wind)} kt, gust ${Math.round(h.gust)} kt${h.safe ? ", fly-safe" : ""}`}
                  className={cn("flex-1", h.safe ? "bg-emerald-500/70" : "bg-navy-700", h.ts + 3600000 < Date.now() && "opacity-40")}
                />
              ))}
            </div>
            <div className="mt-1 flex gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-500/70" /> fly-safe</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-navy-700" /> hold</span>
            </div>
          </div>
          <ol className="grid gap-1 text-sm">
            {data.slots.filter((s) => s.to > Date.now()).slice(0, 5).map((s) => (
              <li key={s.from} className="flex justify-between rounded-md bg-navy-800 px-3 py-1.5">
                <span className="font-mono text-xs">{fmtTime(s.from, stationCode)}</span>
                <span className="text-xs text-slate-400">{Math.round((s.to - s.from) / 3600000)} h</span>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Wind size={12} /> Live Open-Meteo forecast. Limits: wind under {data.limits.windKt} kt, gusts under {data.limits.gustKt} kt, visibility over 5 km. We suggest; the pilot decides.
          </p>
        </>
      )}
    </Card>
  );
}

export default function IcePage() {
  const stations = useQuery(api.stations.list);
  const [code, setCode] = useState("BHARATI");
  const station = stations?.find((s) => s.code === code);
  const berths = rankBerths(code);
  const best = berths[0];

  return (
    <>
      <PageHeader title="Sea ice & helicopters" subtitle="Pick the berth with the least ice and the shortest haul, then fly when the weather allows.">
        <Select aria-label="Station" value={code} onChange={(e) => setCode(e.target.value)} className="w-40">
          <option value="BHARATI">Bharati</option>
          <option value="MAITRI">Maitri</option>
        </Select>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-4">
          <Card className="p-3">{station ? <IceMap station={station} berths={berths} bestId={best.id} /> : <div className="h-[420px] animate-pulse rounded-xl bg-navy-900" />}</Card>
          <p className="text-xs text-slate-500">
            Overlay: AMSR2 sea-ice concentration via NASA GIBS, {ICE_DATE} (latest published). Berth ice figures are simulated stand-ins for processed ISRO EOS-04 / Sentinel-1 SAR.
          </p>
          <Card>
            <CardTitle className="flex items-center gap-2"><Anchor size={14} /> Candidate berths</CardTitle>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {berths.map((b, i) => (
                <div key={b.id} className={cn("rounded-lg border p-3", i === 0 ? "border-emerald-500/50 bg-emerald-500/10" : "border-navy-700 bg-navy-800")}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{b.name}</span>
                    {i === 0 && <Badge tone="green">Suggested</Badge>}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold">{b.score}</div>
                  <div className="text-[11px] text-slate-400">
                    {b.iceConc}% ice, {b.iceThickM} m thick, {b.distKm} km to station
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <HeliSlots stationCode={code} />
      </div>
    </>
  );
}
