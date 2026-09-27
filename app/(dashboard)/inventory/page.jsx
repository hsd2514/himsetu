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
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

const ICON = { diesel: Fuel, food: Wheat, medical: Cross, spares: Wrench };
const NAME = { diesel: "Diesel", food: "Food", medical: "Medical kits", spares: "Spares" };

function StockCard({ row, stockOut, selected, onSelect }) {
  const Icon = ICON[row.item];
  const t = useT();
  const days = row.daysToSafety;
  const tone = days === null ? "default" : days < 30 ? "red" : days < 60 ? "amber" : "green";
  const pct = Math.min(100, (row.qty / (row.safetyLevel * 5)) * 100);
  const safetyPct = Math.min(100, 20);
  return (
    <button type="button" onClick={onSelect} className={cn("rounded-xl border bg-white/[0.02] p-4 text-left transition hover:border-white/20", selected ? "border-ice-500" : "border-white/[0.08]")}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-slate-300"><Icon size={16} className="text-ice-300" /> {t(NAME[row.item])}</span>
        <Badge tone={tone}>{days === null ? t("No burn") : t("{n} d to safety", { n: Math.max(0, Math.floor(days)) })}</Badge>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold">
        {row.qty.toLocaleString("en-IN")} <span className="text-sm font-normal text-slate-400">{row.unit}</span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-navy-800">
        <div className="h-2 rounded-full bg-ice-500" style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 h-4 w-px bg-red-400" style={{ left: `${safetyPct}%` }} title={t("Safety level")} />
      </div>
      <div className="mt-2 text-xs text-slate-400">
        {t("Burn {rate} {unit}/day · safety {level} {unit}", { rate: row.daily.toFixed(row.daily < 10 ? 1 : 0), unit: row.unit, level: row.safetyLevel.toLocaleString("en-IN") })}
        {stockOut && <span className="block text-slate-300">{t("Forecast hits safety on {date}", { date: fmtDate(stockOut) })}</span>}
      </div>
    </button>
  );
}

export default function InventoryPage() {
  const rows = useQuery(api.inventory.list);
  const outs = useQuery(api.forecast.stockOuts) ?? [];
  const [sel, setSel] = useState({ stationCode: "MAITRI", item: "diesel" });
  const t = useT();
  const outFor = (r) => outs.find((o) => o.stationCode === r.stationCode && o.item === r.item)?.stockOutDate;
  return (
    <>
      <PageHeader title={t("Inventory & forecast")} subtitle={t("Stock against burn rate. Pick a card to see its burn-down.")}>
        <Select aria-label={t("Station")} value={sel.stationCode} onChange={(e) => setSel({ ...sel, stationCode: e.target.value })} className="w-40">
          <option value="MAITRI">{t("Maitri")}</option>
          <option value="BHARATI">{t("Bharati")}</option>
        </Select>
      </PageHeader>
      <Card className="mb-8">
        <BurnDownChart stationCode={sel.stationCode} item={sel.item} />
      </Card>
      {rows === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/[0.03]" />)}</div>
      ) : (
        ["MAITRI", "BHARATI"].map((code) => (
          <section key={code} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{t(code === "MAITRI" ? "Maitri" : "Bharati")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rows.filter((r) => r.stationCode === code).map((r) => <StockCard key={r._id} row={r} stockOut={outFor(r)} selected={sel.stationCode === r.stationCode && sel.item === r.item} onSelect={() => setSel({ stationCode: r.stationCode, item: r.item })} />)}
            </div>
          </section>
        ))
      )}
      <p className="text-xs text-slate-500">{t("Stock and 60 days of consumption are simulated. Forecast: Holt-Winters with weekly seasonality, computed live. TimesFM-3 appears when its notebook output is imported.")}</p>
    </>
  );
}
