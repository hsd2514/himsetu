"use client";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Lock, Siren } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { MissionMap } from "@/components/mission-map";
import { useMe } from "@/components/use-me";
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
          <Siren size={18} /> <span className="font-semibold">SOS from {sos.teamName ?? sos.fromName}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {sos.fromName} · received {fmtTime(sos.deliveredAt ?? sos.queuedAt, "GOA")}
        </p>
        <div className="mt-3 rounded-lg bg-navy-900 p-3 text-sm">
          {text ?? (
            <span className="text-slate-400">
              Encrypted. Only {me?.name ?? "the addressee"} on the right device can read this.
            </span>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-300">
            <Lock size={12} /> End-to-end encrypted
          </div>
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400">
          GPS {sos.lat.toFixed(4)}, {sos.lon.toFixed(4)}
        </div>
        <h4 className="mt-4 text-sm font-medium text-slate-200">Nearest responders</h4>
        <ol className="mt-2 grid gap-2">
          {(nearest ?? []).map((t) => (
            <li key={t._id} className="flex items-center justify-between rounded-lg bg-navy-900 px-3 py-2 text-sm">
              <span>{t.name}</span>
              <span className="font-mono text-xs text-slate-300">
                {t.km.toFixed(1)} km · ETA {t.etaMin} min {t.kind === "vehicle" ? "(20 km/h)" : "(8 km/h)"}
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
