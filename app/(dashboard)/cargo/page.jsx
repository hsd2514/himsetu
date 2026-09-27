"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, ScanLine, Search, Flame, Snowflake } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { HOP_LABEL, HopProgress } from "@/components/hop-progress";
import { useT } from "@/components/language-context";

export default function CargoPage() {
  const crates = useQuery(api.crates.list);
  const [q, setQ] = useState("");
  const [hop, setHop] = useState("all");
  const t = useT();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (crates ?? []).filter(
      (c) =>
        (hop === "all" || c.status === hop) &&
        (!needle || c.item.toLowerCase().includes(needle) || c.qrId.toLowerCase().includes(needle))
    );
  }, [crates, q, hop]);

  return (
    <>
      <PageHeader title={t("Cargo")} subtitle={t("Chain of custody from the Goa warehouse to the station.")}>
        <div className="flex gap-2">
          <Link href="/cargo/scan" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.98]">
            <ScanLine size={16} /> {t("Scan")}
          </Link>
          <Link href="/cargo/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-ice-500 px-4 text-sm font-medium text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] transition-colors hover:bg-ice-400 active:scale-[0.98]">
            <Plus size={16} /> {t("New crate")}
          </Link>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input aria-label={t("Search crates")} placeholder={t("Search by item or label, e.g. HMS-1004")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label={t("Filter by hop")} value={hop} onChange={(e) => setHop(e.target.value)}>
          <option value="all">{t("All locations")}</option>
          {Object.entries(HOP_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{t(l)}</option>
          ))}
        </Select>
      </div>

      {crates === undefined ? (
        <div className="surface grid divide-y divide-white/[0.06] rounded-2xl">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse bg-white/[0.02]" />)}</div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
          {t("No crates match. Clear the search or create one with New crate.")}
        </p>
      ) : (
        <div className="rise surface divide-y divide-white/[0.06] overflow-hidden rounded-2xl" style={{ "--i": 1 }}>
          <div className="hidden grid-cols-[110px_1fr_140px_240px] gap-4 px-5 py-2.5 text-[11px] text-slate-500 sm:grid">
            <span>{t("Label")}</span>
            <span>{t("Item")}</span>
            <span>{t("Weight, destination")}</span>
            <span>{t("Custody")}</span>
          </div>
          {rows.map((c) => (
            <Link
              key={c._id}
              href={`/cargo/${c._id}`}
              className="grid items-center gap-2 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:grid-cols-[110px_1fr_140px_240px] sm:gap-4"
            >
              <span className="font-mono text-xs text-ice-300">{c.qrId}</span>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {c.item}
                {c.priority === 1 && <Badge tone="red">{t("Urgent")}</Badge>}
                {c.hazmat && <Badge tone="amber"><Flame size={11} /> {t("Hazmat")}</Badge>}
                {c.coldChain && <Badge tone="ice"><Snowflake size={11} /> {t("Cold chain")}</Badge>}
              </span>
              <span className="font-mono text-xs text-slate-400">{c.weightKg} kg → {c.destination}</span>
              <HopProgress status={c.status} />
            </Link>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">{t("Seeded crates are simulated for the demo.")}</p>
    </>
  );
}
