"use client";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Gauge, RotateCcw } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionMap } from "@/components/mission-map";
import { PassCountdowns } from "@/components/pass-countdown";
import { SosPanel } from "@/components/sos-panel";
import { LinkQueue } from "@/components/link-queue";
import { NextWindows } from "@/components/next-windows";
import { useStation } from "@/components/station-context";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

function Kpi({ label, value, tone, href }) {
  return (
    <Link href={href} className="group bg-[#0a1323] p-4 transition-colors hover:bg-[#0e1a2f] md:p-5">
      <div className="flex items-start justify-between gap-2 text-xs text-slate-400">
        {label}
        <ArrowUpRight size={14} className="shrink-0 text-slate-600 transition-colors group-hover:text-ice-300" />
      </div>
      <div className={cn("tnum mt-2 font-mono text-4xl font-semibold tracking-tight", tone ?? "text-slate-50")}>
        {value ?? <span className="inline-block h-9 w-10 animate-pulse rounded bg-white/5 align-middle" />}
      </div>
    </Link>
  );
}

export default function MissionPage() {
  const { node } = useStation();
  const t = useT();
  const stations = useQuery(api.stations.list);
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
      <Card className="rise mx-auto mt-16 max-w-md text-center">
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

      {/* 1px gaps over a line-coloured backing draw the dividers at every breakpoint. */}
      <section style={{ "--i": 1 }} className="rise grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4">
        <Kpi href="/cargo" label={t("Crates in transit")} value={crateStats?.inTransit} />
        <Kpi href="/inventory" label={t("Stock-out risks (60 d)")} value={risks} tone={risks ? "text-amber-300" : undefined} />
        <Kpi href="/messages" label={t("Messages waiting for a pass")} value={queue?.length} tone={queue?.length ? "text-ice-300" : undefined} />
        <Kpi href="/field" label={t("Open alerts")} value={alerts?.length} tone={alerts?.length ? "text-red-300" : undefined} />
      </section>

      <section style={{ "--i": 2 }} className="rise mt-6">
        <PassCountdowns />
        <p className="mt-2 px-1 text-xs text-slate-500">
          {t("SGP4 on Iridium NEXT TLEs ({source}).", { source: t(passes?.tleSource === "celestrak" ? "live from CelesTrak" : "bundled snapshot") })}
          {speed === 60 && ` ${t("Demo mode: one real second is one mission minute.")}`}
        </p>
      </section>

      <SosPanel />

      <section style={{ "--i": 3 }} className="rise mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden p-0">
          <MissionMap stations={stations ?? []} height={420} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-3 rounded-lg bg-navy-950/85 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ice-500" /> {t("NCPOR Goa Hub")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-ice-400" /> {t("Resupply route")}</span>
          </div>
        </Card>
        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <CardTitle>{t("Link queue")}</CardTitle>
            <Badge tone="ice">{t("SOS goes first")}</Badge>
          </div>
          <LinkQueue />
          <NextWindows />
        </Card>
      </section>
    </>
  );
}
