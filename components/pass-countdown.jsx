"use client";
import { useQuery } from "convex/react";
import { Satellite } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/components/use-me";
import { useT } from "@/components/language-context";
import { fmtCountdown, missionNow } from "@/lib/time";
import { cn } from "@/lib/utils";

const LABEL = { SHIP: "Ship", MAITRI: "Maitri", BHARATI: "Bharati" };

function LinkCell({ code, data, mnow, t }) {
  const list = data.passes[code] ?? [];
  const live = list.find((p) => p.aos <= mnow && p.los >= mnow);
  const next = list.find((p) => p.aos > mnow);
  const realMs = next ? (next.aos - mnow) / data.settings.demoSpeed : null;

  return (
    <div className={cn("relative p-4 transition-colors md:p-5", live && "bg-emerald-400/[0.06]")}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{t("{name} link", { name: t(LABEL[code]) })}</span>
        {live ? (
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="live-dot relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t("Satellite overhead")}
          </span>
        ) : (
          <Satellite size={14} strokeWidth={1.75} className="text-slate-500" />
        )}
      </div>
      {live ? (
        <div className="mt-2">
          <div className="tnum font-mono text-3xl font-semibold tracking-tight text-emerald-200">{live.satName.replace("IRIDIUM ", "IR-")}</div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">{t("{deg}° max elevation", { deg: live.maxElevDeg.toFixed(0) })}</div>
        </div>
      ) : next ? (
        <div className="mt-2">
          <div className="tnum font-mono text-3xl font-semibold tracking-tight text-slate-50">{fmtCountdown(realMs)}</div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            {t("next {sat}, {deg}° max elevation", { sat: next.satName, deg: next.maxElevDeg.toFixed(0) })}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-400">{t("Predicting passes…")}</div>
      )}
    </div>
  );
}

/** Live link state per remote node: in-pass now, or countdown to the next window. */
export function PassCountdowns({ only, compact = false }) {
  const data = useQuery(api.passes.upcoming);
  const now = useNow(500);
  const t = useT();
  if (!data) return <div className={cn("surface animate-pulse rounded-2xl", compact ? "h-28" : "h-32")} />;
  const mnow = missionNow(data.settings, now);
  const codes = only ? [only] : Object.keys(LABEL);

  return (
    <div
      className={cn(
        "surface grid overflow-hidden rounded-2xl",
        !compact && codes.length > 1 && "divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      )}
    >
      {codes.map((code) => (
        <LinkCell key={code} code={code} data={data} mnow={mnow} t={t} />
      ))}
    </div>
  );
}
