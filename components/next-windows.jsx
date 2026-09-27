"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/components/use-me";
import { useT } from "@/components/language-context";
import { fmtCountdown, missionNow } from "@/lib/time";

const LABEL = { SHIP: "Ship", MAITRI: "Maitri", BHARATI: "Bharati" };

/** The next satellite windows across all remote nodes, soonest first. */
export function NextWindows({ limit = 6 }) {
  const data = useQuery(api.passes.upcoming);
  const now = useNow(1000);
  const t = useT();
  if (!data) return null;
  const mnow = missionNow(data.settings, now);
  const speed = data.settings.demoSpeed;
  const rows = Object.entries(data.passes)
    .flatMap(([code, list]) => list.filter((p) => p.aos > mnow).map((p) => ({ ...p, code })))
    .sort((a, b) => a.aos - b.aos)
    .slice(0, limit);

  return (
    <div className="mt-6 border-t border-white/[0.06] pt-4">
      <h4 className="text-xs text-slate-400">{t("Next satellite windows")}</h4>
      <ol className="mt-2 divide-y divide-white/[0.04]">
        {rows.map((p) => (
          <li key={p._id} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 py-2 text-sm">
            <span className="text-slate-300">{t(LABEL[p.code])}</span>
            <span className="truncate font-mono text-[11px] text-slate-500">
              {p.satName} · {Math.round((p.los - p.aos) / 60000)} min · {p.maxElevDeg.toFixed(0)}°
            </span>
            <span className="tnum font-mono text-xs text-slate-200">{fmtCountdown((p.aos - mnow) / speed)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
