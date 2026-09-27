"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HOPS, HOP_LABEL } from "@/components/hop-progress";
import { fmtTime } from "@/lib/time";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

export default function CratePage({ params }) {
  const { id } = use(params);
  const data = useQuery(api.crates.get, { id });
  const t = useT();

  if (data === undefined) return <div className="h-64 animate-pulse rounded-xl bg-navy-900" />;
  if (data === null) return <p className="text-slate-400">{t("Crate not found.")}</p>;
  const { crate, events } = data;

  return (
    <>
      <Link href="/cargo" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={14} /> {t("Cargo")}
      </Link>
      <PageHeader title={crate.item} subtitle={`${crate.qrId} · ${crate.weightKg} kg · ${t("bound for {place}", { place: crate.destination })}`}>
        <div className="flex gap-2">
          {crate.hazmat && <Badge tone="amber">{t("Hazmat")}</Badge>}
          {crate.coldChain && <Badge tone="ice">{t("Cold chain")}</Badge>}
          {crate.priority === 1 && <Badge tone="red">{t("Urgent")}</Badge>}
        </div>
      </PageHeader>
      <Card>
        <ol className="relative grid gap-6 pl-8">
          <span className="absolute bottom-2 left-[11px] top-2 w-px bg-navy-700" />
          {HOPS.map((hop) => {
            const ev = events.filter((e) => e.hop === hop).at(-1);
            return (
              <li key={hop} className="relative">
                <span
                  className={cn(
                    "absolute -left-8 top-0.5 grid h-6 w-6 place-items-center rounded-full border",
                    ev ? "border-ice-400 bg-ice-500 text-navy-950" : "border-navy-700 bg-navy-900"
                  )}
                >
                  {ev && <Check size={14} />}
                </span>
                <div className={cn("text-sm font-medium", !ev && "text-slate-500")}>{t(HOP_LABEL[hop])}</div>
                {ev ? (
                  <div className="text-xs text-slate-400">
                    {fmtTime(ev.ts, ev.stationCode)} · {t("scanned by {name}", { name: ev.scannedBy })}
                    {ev.note && <span className="block text-slate-300">{ev.note}</span>}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">{t("Not yet scanned")}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}
