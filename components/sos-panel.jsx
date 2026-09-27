"use client";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Lock, Siren } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { MissionMap } from "@/components/mission-map";
import { useMe } from "@/components/use-me";
import { useT } from "@/components/language-context";
import { decryptFor } from "@/lib/crypto";
import { fmtTime } from "@/lib/time";

/** Latest SOS that reached Goa: decrypted text, GPS, and the nearest responders with ETA. */
export function SosPanel() {
  const sos = useQuery(api.sos.latestDelivered);
  const teams = useQuery(api.people.teams) ?? [];
  const nearest = useQuery(
    api.sos.nearest,
    sos ? { lat: sos.lat, lon: sos.lon, excludeTeamId: sos.teamId ?? undefined } : "skip"
  );
  const { me } = useMe();
  const [text, setText] = useState(null);
  const t = useT();

  useEffect(() => {
    if (!sos || !me) return;
    decryptFor(sos, me._id).then(setText);
  }, [sos, me]);

  if (!sos) return null;
  const best = nearest?.[0];

  return (
    <section className="mt-6 grid gap-4 rounded-xl border border-red-500/40 bg-red-950/30 p-4 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="flex items-center gap-2 text-red-300">
          <Siren size={18} /> <span className="font-semibold">{t("SOS from {name}", { name: sos.teamName ?? sos.fromName })}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {sos.fromName} · {t("received {time}", { time: fmtTime(sos.deliveredAt ?? sos.queuedAt, "GOA") })}
        </p>
        <div className="mt-3 rounded-lg bg-white/[0.03] p-3 text-sm">
          {text ?? (
            <span className="text-slate-400">
              {t("Encrypted. Only {name} on the right device can read this.", { name: me?.name ?? t("the addressee") })}
            </span>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-300">
            <Lock size={12} /> {t("End-to-end encrypted")}
          </div>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400">
          GPS {sos.lat.toFixed(4)}, {sos.lon.toFixed(4)}
        </div>
        <h4 className="mt-4 text-sm font-medium text-slate-200">{t("Nearest responders")}</h4>
        <ol className="mt-2 grid gap-2">
          {(nearest ?? []).map((r) => (
            <li key={r._id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
              <span>{r.name}</span>
              <span className="font-mono text-xs text-slate-300">
                {t("{km} km · ETA {min} min", { km: r.km.toFixed(1), min: r.etaMin })} {r.kind === "vehicle" ? "(20 km/h)" : "(8 km/h)"}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <MissionMap
        teams={teams}
        sos={{ lat: sos.lat, lon: sos.lon, nearest: best }}
        center={[sos.lat, sos.lon]}
        zoom={10}
        height={320}
      />
    </section>
  );
}
