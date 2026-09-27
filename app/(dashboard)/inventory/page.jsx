"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { Fuel, Wheat, Cross, Wrench } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/time";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { BurnDownChart } from "@/components/burn-down-chart";
import { cn } from "@/lib/utils";

const ICON = { diesel: Fuel, food: Wheat, medical: Cross, spares: Wrench };
const NAME = { diesel: "Diesel", food: "Food", medical: "Medical kits", spares: "Spares" };

function StockCard({ row, stockOut, selected, onSelect }) {
  const Icon = ICON[row.item];
  const days = row.daysToSafety;
  const tone = days === null ? "default" : days < 30 ? "red" : days < 60 ? "amber" : "green";
  const pct = Math.min(100, (row.qty / (row.safetyLevel * 5)) * 100);
  const safetyPct = Math.min(100, 20);
  return (
    <button type="button" onClick={onSelect} className={cn("rounded-xl border bg-navy-900 p-4 text-left transition hover:border-navy-700", selected ? "border-ice-500" : "border-navy-800")}>
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
        {stockOut && <span className="block text-slate-300">Forecast hits safety on {fmtDate(stockOut)}</span>}
      </div>
    </button>
  );
}

export default function InventoryPage() {
  const rows = useQuery(api.inventory.list);
  const outs = useQuery(api.forecast.stockOuts) ?? [];
  const [sel, setSel] = useState({ stationCode: "MAITRI", item: "diesel" });
  const outFor = (r) => outs.find((o) => o.stationCode === r.stationCode && o.item === r.item)?.stockOutDate;
  return (
    <>
      <PageHeader title="Inventory & forecast" subtitle="Stock against burn rate. Pick a card to see its burn-down.">
        <Select aria-label="Station" value={sel.stationCode} onChange={(e) => setSel({ ...sel, stationCode: e.target.value })} className="w-40">
          <option value="MAITRI">Maitri</option>
          <option value="BHARATI">Bharati</option>
        </Select>
      </PageHeader>
      <Card className="mb-8">
        <BurnDownChart stationCode={sel.stationCode} item={sel.item} />
      </Card>
      {rows === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-navy-900" />)}</div>
      ) : (
        ["MAITRI", "BHARATI"].map((code) => (
          <section key={code} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{code === "MAITRI" ? "Maitri" : "Bharati"}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rows.filter((r) => r.stationCode === code).map((r) => <StockCard key={r._id} row={r} stockOut={outFor(r)} selected={sel.stationCode === r.stationCode && sel.item === r.item} onSelect={() => setSel({ stationCode: r.stationCode, item: r.item })} />)}
            </div>
          </section>
        ))
      )}
      <p className="text-xs text-slate-500">Stock and 60 days of consumption are simulated. Forecast: Holt-Winters with weekly seasonality, computed live. TimesFM-3 appears when its notebook output is imported.</p>
    </>
  );
}
