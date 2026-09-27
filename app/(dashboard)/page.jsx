"use client";
import { useMutation, useQuery } from "convex/react";
import { Gauge, RotateCcw } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionMap } from "@/components/mission-map";
import { PassCountdowns } from "@/components/pass-countdown";
import { SosPanel } from "@/components/sos-panel";
import { LinkQueue } from "@/components/link-queue";
import { useStation } from "@/components/station-context";
import { useT } from "@/components/language-context";

function Kpi({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-3xl font-semibold ${tone ?? "text-slate-100"}`}>{value ?? "-"}</div>
    </div>
  );
}

export default function MissionPage() {
  const { node } = useStation();
  const t = useT();
  const stations = useQuery(api.stations.list);
  const teams = useQuery(api.people.teams);
  const crateStats = useQuery(api.crates.stats);
  const outs = useQuery(api.forecast.stockOuts);
  const queue = useQuery(api.messages.queue);
  const alerts = useQuery(api.sos.openAlerts);
  const passes = useQuery(api.passes.upcoming);
  const seed = useMutation(api.stations.seed);
  const reset = useMutation(api.seed.reset);
  const setSpeed = useMutation(api.link.setDemoSpeed);

  const risks = outs?.filter((o) => o.stockOutDate && o.stockOutDate - Date.now() < 60 * 86400000).length;
  const speed = passes?.settings.demoSpeed ?? 60;

  if (stations?.length === 0) {
    return (
      <Card className="mx-auto mt-16 max-w-md text-center">
        <h2 className="text-lg font-semibold">{t("No mission data yet")}</h2>
        <p className="mt-2 text-sm text-slate-400">{t("Load the simulated season: stations, crates, field teams and 60 days of stock use.")}</p>
        <Button className="mt-4" onClick={() => seed()}>{t("Load demo data")}</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title={t(node.code === "GOA" ? "NCPOR Goa Hub" : node.label)} subtitle={t("Every crate, drum and person on one map, refreshed at each satellite pass.")}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSpeed({ demoSpeed: speed === 60 ? 1 : 60 })}>
            <Gauge size={14} /> {t(speed === 60 ? "Demo speed 60×" : "Real time")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => reset()}>
            <RotateCcw size={14} /> {t("Reset demo")}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("Crates in transit")} value={crateStats?.inTransit} />
        <Kpi label={t("Stock-out risks (60 d)")} value={risks} tone={risks ? "text-amber-300" : undefined} />
        <Kpi label={t("Messages waiting for a pass")} value={queue?.length} tone={queue?.length ? "text-ice-300" : undefined} />
        <Kpi label={t("Open alerts")} value={alerts?.length} tone={alerts?.length ? "text-red-300" : undefined} />
      </div>

      <div className="mt-6">
        <PassCountdowns />
        <p className="mt-2 text-xs text-slate-500">
          {t("SGP4 on Iridium NEXT TLEs ({source}).", { source: t(passes?.tleSource === "celestrak" ? "live from CelesTrak" : "bundled snapshot") })}
          {speed === 60 && ` ${t("Demo mode: one real second is one mission minute.")}`}
        </p>
      </div>

      <SosPanel />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-3">
          <MissionMap stations={stations ?? []} />
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>{t("Link queue")}</CardTitle>
            <Badge tone="ice">{t("SOS goes first")}</Badge>
          </div>
          <LinkQueue />
        </Card>
      </div>
    </>
  );
}
