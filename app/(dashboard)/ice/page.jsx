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
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

const IceMap = dynamic(() => import("@/components/ice-map-inner"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-white/[0.03]" />,
});

function HeliSlots({ stationCode }) {
  const fetchSlots = useAction(api.weather.heliSlots);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const t = useT();

  async function load() {
    setBusy(true);
    setError(null);
    try {
      setData(await fetchSlots({ stationCode }));
    } catch (e) {
      setError(t("Could not reach Open-Meteo. Check the connection and retry."));
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
        <CardTitle className="flex items-center gap-2"><Plane size={14} /> {t("Helicopter slots, next 72 h")}</CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={busy} aria-label={t("Refresh forecast")}>
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        </Button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!data && !error && <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />}
      {data && (
        <>
          {next ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
              <div className="text-xs text-emerald-300">{t("Next fly-safe window")}</div>
              <div className="mt-1 font-mono text-lg text-slate-100">
                {fmtTime(next.from, stationCode)}, {t("{h} h", { h: Math.round((next.to - next.from) / 3600000) })}
              </div>
              <div className="text-xs text-slate-400">
                {t("wind ≤ {w} kt, gusts ≤ {g} kt, visibility ≥ {v} km", { w: Math.round(next.maxWind), g: Math.round(next.maxGust), v: next.minVisKm.toFixed(0) })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-white/[0.04] p-3 text-sm text-slate-300">{t("No fly-safe window in the next 72 hours. Hold sorties.")}</p>
          )}
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-slate-400">
              <span>{t("Now")}</span><span>+{t("{h} h", { h: 24 })}</span><span>+{t("{h} h", { h: 48 })}</span><span>+{t("{h} h", { h: 72 })}</span>
            </div>
            <div className="flex h-6 gap-px overflow-hidden rounded-md" role="img" aria-label={t("Hourly fly-safe forecast")}>
              {data.hours.map((h) => (
                <span
                  key={h.ts}
                  title={`${fmtTime(h.ts, stationCode)}: ${t("wind {w} kt, gust {g} kt", { w: Math.round(h.wind), g: Math.round(h.gust) })}${h.safe ? `, ${t("fly-safe")}` : ""}`}
                  className={cn("flex-1", h.safe ? "bg-emerald-500/70" : "bg-navy-700", h.ts + 3600000 < Date.now() && "opacity-40")}
                />
              ))}
            </div>
            <div className="mt-1 flex gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-500/70" /> {t("fly-safe")}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-navy-700" /> {t("hold")}</span>
            </div>
          </div>
          <ol className="grid gap-1 text-sm">
            {data.slots.filter((s) => s.to > Date.now()).slice(0, 5).map((s) => (
              <li key={s.from} className="flex justify-between rounded-md bg-white/[0.04] px-3 py-1.5">
                <span className="font-mono text-xs">{fmtTime(s.from, stationCode)}</span>
                <span className="text-xs text-slate-400">{t("{h} h", { h: Math.round((s.to - s.from) / 3600000) })}</span>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Wind size={12} /> {t("Live Open-Meteo forecast. Limits: wind under {w} kt, gusts under {g} kt, visibility over 5 km. We suggest; the pilot decides.", { w: data.limits.windKt, g: data.limits.gustKt })}
          </p>
        </>
      )}
    </Card>
  );
}

export default function IcePage() {
  const stations = useQuery(api.stations.list);
  const [code, setCode] = useState("BHARATI");
  const t = useT();
  const station = stations?.find((s) => s.code === code);
  const berths = rankBerths(code);
  const best = berths[0];

  return (
    <>
      <PageHeader title={t("Sea ice & helicopters")} subtitle={t("Pick the berth with the least ice and the shortest haul, then fly when the weather allows.")}>
        <Select aria-label={t("Station")} value={code} onChange={(e) => setCode(e.target.value)} className="w-40">
          <option value="BHARATI">{t("Bharati")}</option>
          <option value="MAITRI">{t("Maitri")}</option>
        </Select>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-4">
          <Card className="p-3">{station ? <IceMap station={station} berths={berths} bestId={best.id} /> : <div className="h-[420px] animate-pulse rounded-2xl bg-white/[0.03]" />}</Card>
          <p className="text-xs text-slate-500">
            {t("Overlay: AMSR2 sea-ice concentration via NASA GIBS, {date} (latest published). Berth ice figures are simulated stand-ins for processed ISRO EOS-04 / Sentinel-1 SAR.", { date: ICE_DATE })}
          </p>
          <Card>
            <CardTitle className="flex items-center gap-2"><Anchor size={14} /> {t("Candidate berths")}</CardTitle>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {berths.map((b, i) => (
                <div key={b.id} className={cn("rounded-lg border p-3", i === 0 ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/[0.04]")}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{b.name}</span>
                    {i === 0 && <Badge tone="green">{t("Suggested")}</Badge>}
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold">{b.score}</div>
                  <div className="text-[11px] text-slate-400">
                    {t("{conc}% ice, {m} m thick, {km} km to station", { conc: b.iceConc, m: b.iceThickM, km: b.distKm })}
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
