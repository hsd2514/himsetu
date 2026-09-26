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

export default function CargoPage() {
  const crates = useQuery(api.crates.list);
  const [q, setQ] = useState("");
  const [hop, setHop] = useState("all");

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
      <PageHeader title="Cargo" subtitle="Chain of custody from the Goa warehouse to the station.">
        <div className="flex gap-2">
          <Link href="/cargo/scan" className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-700 px-4 text-sm hover:bg-navy-800">
            <ScanLine size={16} /> Scan
          </Link>
          <Link href="/cargo/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-ice-500 px-4 text-sm font-medium text-navy-950 hover:bg-ice-400">
            <Plus size={16} /> New crate
          </Link>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input aria-label="Search crates" placeholder="Search by item or label, e.g. HMS-1004" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filter by hop" value={hop} onChange={(e) => setHop(e.target.value)}>
          <option value="all">All locations</option>
          {Object.entries(HOP_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </Select>
      </div>

      {crates === undefined ? (
        <div className="grid gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-navy-900" />)}</div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-700 p-8 text-center text-sm text-slate-400">
          No crates match. Clear the search or create one with New crate.
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((c) => (
            <Link
              key={c._id}
              href={`/cargo/${c._id}`}
              className="grid items-center gap-3 rounded-xl border border-navy-800 bg-navy-900 px-4 py-3 hover:border-navy-700 sm:grid-cols-[110px_1fr_auto_260px]"
            >
              <span className="font-mono text-xs text-ice-300">{c.qrId}</span>
              <span className="flex flex-wrap items-center gap-2 text-sm">
                {c.item}
                {c.priority === 1 && <Badge tone="red">Urgent</Badge>}
                {c.hazmat && <Badge tone="amber"><Flame size={11} /> Hazmat</Badge>}
                {c.coldChain && <Badge tone="ice"><Snowflake size={11} /> Cold chain</Badge>}
              </span>
              <span className="font-mono text-xs text-slate-400">{c.weightKg} kg → {c.destination}</span>
              <HopProgress status={c.status} />
            </Link>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Seeded crates are simulated for the demo.</p>
    </>
  );
}
