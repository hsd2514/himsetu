"use client";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/convex/_generated/api";
import { fmtDate } from "@/lib/time";
import { useT } from "@/components/language-context";
import { useThemeColors } from "@/components/theme-context";

// Series colours come from the active theme (--chart-1/--chart-2, validated per palette). Stock is one entity:
// solid = measured, dashed = Holt-Winters. TimesFM gets the second hue.
const STOCK = "#1f95cc";
const TIMESFM = "#c47a08";
const SAFETY = "#f87171";

function TooltipBox({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-slate-400">{fmtDate(label)}</div>
      {payload
        .filter((p) => p.value !== undefined && p.value !== null)
        .map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-slate-200">
            <span className="h-0.5 w-3" style={{ background: p.stroke }} />
            {p.name}: <span className="font-mono">{Math.round(p.value).toLocaleString("en-IN")} {unit}</span>
          </div>
        ))}
    </div>
  );
}

/** Stock level: 60 days measured, then 120 days forecast, against the safety level. */
export function BurnDownChart({ stationCode, item }) {
  const data = useQuery(api.forecast.burnDown, { stationCode, item });
  const k = useThemeColors();
  const stock = k?.chart1 ?? STOCK;
  const tfmColor = k?.chart2 ?? TIMESFM;
  const safety = k?.light ? "#dc2626" : SAFETY;
  const grid = k?.line ?? "#1b3052";
  const tick = k?.muted ?? "#94a3b8";
  const t = useT();

  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    const put = (date, key, qty) => map.set(date, { ...(map.get(date) ?? { date }), [key]: qty });
    data.actual.forEach((p) => put(p.date, "actual", p.qty));
    data.holtwinters.points.forEach((p) => put(p.date, "hw", p.qty));
    data.timesfm?.points.forEach((p) => put(p.date, "tfm", p.qty));
    return [...map.values()].sort((a, b) => a.date - b.date);
  }, [data]);

  if (data === undefined) return <div className="h-72 animate-pulse rounded-2xl bg-white/[0.03]" />;
  if (data === null) return <p className="text-sm text-slate-400">{t("No stock record for this item.")}</p>;

  const out = data.timesfm?.stockOutDate ?? data.holtwinters.stockOutDate;
  const name = t({ diesel: "Diesel", food: "Food", medical: "Medical kits", spares: "Spares" }[item]);
  const station = t(stationCode === "MAITRI" ? "Maitri" : "Bharati");

  return (
    <figure>
      <figcaption className="mb-3">
        <div className="text-lg font-semibold text-slate-100">
          {out ? t("{item} at {station} hits its safety level on {date}", { item: name, station, date: fmtDate(out) }) : t("{item} at {station} stays above safety for 120 days", { item: name, station })}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="h-0.5 w-5" style={{ background: stock }} />{t("Measured stock")}</span>
          <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed" style={{ borderColor: stock }} />{t("Holt-Winters forecast")}</span>
          {data.timesfm && <span className="flex items-center gap-2"><span className="h-0.5 w-5" style={{ background: tfmColor }} />{t("TimesFM-3 forecast")}</span>}
          <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dotted" style={{ borderColor: safety }} />{t("Safety level")}</span>
        </div>
      </figcaption>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={grid} strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={fmtDate}
              tick={{ fill: tick, fontSize: 11 }}
              stroke={grid}
              tickCount={7}
            />
            <YAxis
              tick={{ fill: tick, fontSize: 11 }}
              stroke={grid}
              width={56}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
            />
            <Tooltip content={<TooltipBox unit={data.unit} />} cursor={{ stroke: tick }} />
            <ReferenceLine
              y={data.safetyLevel}
              stroke={safety}
              strokeDasharray="2 4"
              label={{ value: t("Safety"), position: "insideTopRight", fill: safety, fontSize: 11 }}
            />
            <ReferenceLine x={rows.find((r) => r.hw !== undefined)?.date} stroke={tick} label={{ value: t("Today"), position: "insideTopLeft", fill: tick, fontSize: 11 }} />
            <Line type="monotone" dataKey="actual" name={t("Measured")} stroke={stock} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="hw" name="Holt-Winters" stroke={stock} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            {data.timesfm && <Line type="monotone" dataKey="tfm" name="TimesFM-3" stroke={tfmColor} strokeWidth={2} dot={false} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
