"use client";
import { useQuery } from "convex/react";
import { Fuel, Wheat, Cross, Wrench } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/time";

const ICON = { diesel: Fuel, food: Wheat, medical: Cross, spares: Wrench };
const NAME = { diesel: "Diesel", food: "Food", medical: "Medical kits", spares: "Spares" };

function StockCard({ row }) {
  const Icon = ICON[row.item];
  const days = row.daysToSafety;
  const date = days !== null ? Date.now() + days * 86400000 : null;
  const tone = days === null ? "default" : days < 30 ? "red" : days < 60 ? "amber" : "green";
  const pct = Math.min(100, (row.qty / (row.safetyLevel * 5)) * 100);
  const safetyPct = Math.min(100, 20);
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-slate-300"><Icon size={16} className="text-ice-300" /> {NAME[row.item]}</span>
        <Badge tone={tone}>{days === null ? "No burn" : `${Math.max(0, Math.floor(days))} d to safety`}</Badge>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold">
        {row.qty.toLocaleString("en-IN")} <span className="text-sm font-normal text-slate-400">{row.unit}</span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-navy-800">
        <div className="h-2 rounded-full bg-ice-500" style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 h-4 w-px bg-red-400" style={{ left: `${safetyPct}%` }} title="Safety level" />
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Burn {row.daily.toFixed(row.daily < 10 ? 1 : 0)} {row.unit}/day · safety {row.safetyLevel.toLocaleString("en-IN")} {row.unit}
        {date && days < 120 && <span className="block text-slate-300">Hits safety level on {fmtDate(date)}</span>}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const rows = useQuery(api.inventory.list);
  return (
    <>
      <PageHeader title="Inventory & forecast" subtitle="Stock at each station against its 14-day burn rate." />
      {rows === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-navy-900" />)}</div>
      ) : (
        ["MAITRI", "BHARATI"].map((code) => (
          <section key={code} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{code === "MAITRI" ? "Maitri" : "Bharati"}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rows.filter((r) => r.stationCode === code).map((r) => <StockCard key={r._id} row={r} />)}
            </div>
          </section>
        ))
      )}
      <p className="text-xs text-slate-500">Stock and 60 days of consumption are simulated. TimesFM-3 and Holt-Winters burn-down charts land with the forecast issues.</p>
    </>
  );
}
