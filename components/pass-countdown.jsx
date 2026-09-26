"use client";
import { useQuery } from "convex/react";
import { Satellite } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/components/use-me";
import { fmtCountdown, missionNow } from "@/lib/time";
import { cn } from "@/lib/utils";

const LABEL = { SHIP: "Ship", MAITRI: "Maitri", BHARATI: "Bharati" };

/** Live link state per remote node: in-pass now, or countdown to the next window. */
export function PassCountdowns({ only, compact = false }) {
  const data = useQuery(api.passes.upcoming);
  const now = useNow(500);
  if (!data) return <div className="h-24 animate-pulse rounded-xl bg-navy-900" />;
  const mnow = missionNow(data.settings, now);
  const codes = only ? [only] : Object.keys(LABEL);

  return (
    <div className={cn("grid gap-3", !compact && "sm:grid-cols-3")}>
      {codes.map((code) => {
        const list = data.passes[code] ?? [];
        const live = list.find((p) => p.aos <= mnow && p.los >= mnow);
        const next = list.find((p) => p.aos > mnow);
        const realMs = next ? (next.aos - mnow) / data.settings.demoSpeed : null;
        return (
          <div
            key={code}
            className={cn(
              "rounded-xl border p-4",
              live ? "border-emerald-500/50 bg-emerald-500/10" : "border-navy-700 bg-navy-900"
            )}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{LABEL[code]} link</span>
              <Satellite size={14} className={live ? "text-emerald-400" : "text-slate-500"} />
            </div>
            {live ? (
              <div className="mt-1">
                <div className="text-lg font-semibold text-emerald-300">Satellite overhead</div>
                <div className="font-mono text-xs text-slate-400">
                  {live.satName} · {live.maxElevDeg.toFixed(0)}° max elevation
                </div>
              </div>
            ) : next ? (
              <div className="mt-1">
                <div className="font-mono text-2xl font-semibold text-slate-100">{fmtCountdown(realMs)}</div>
                <div className="font-mono text-xs text-slate-400">
                  next {next.satName}, {next.maxElevDeg.toFixed(0)}° max elevation
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-slate-400">Predicting passes…</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
