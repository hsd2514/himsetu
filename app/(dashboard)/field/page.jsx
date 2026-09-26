"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CircleCheck, Clock3, LifeBuoy, MapPin, WifiOff } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PassCountdowns } from "@/components/pass-countdown";
import { useSend } from "@/components/composer";
import { MessageRow } from "@/components/message-row";
import { useMe, useNow } from "@/components/use-me";
import { useStation } from "@/components/station-context";

// Fallback position near Maitri if the browser has no GPS (simulated, shown as such).
const FALLBACK = { lat: -70.812, lon: 11.61, simulated: true };

function useGps() {
  // Start from the simulated fix so SOS never waits on a permission prompt.
  const [pos, setPos] = useState(FALLBACK);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        // Real GPS far from Antarctica would put the SOS in India; keep the demo on the ice.
        const onIce = p.coords.latitude < -60;
        if (onIce) setPos({ lat: p.coords.latitude, lon: p.coords.longitude, simulated: false });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);
  return pos;
}

export default function FieldPage() {
  const { node, setNodeCode } = useStation();
  const { me, keyReady } = useMe();
  const gps = useGps();
  const send = useSend(me);
  const checkIn = useMutation(api.sos.checkIn);
  const messages = useQuery(api.messages.forPerson, me ? { personId: me._id } : "skip");
  const now = useNow(1000);
  const [online, setOnline] = useState(true);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (node.code !== "FIELD") setNodeCode("FIELD");
  }, [node.code, setNodeCode]);

  async function preset(kind) {
    if (!me || !gps) return;
    const coords = `${gps.lat.toFixed(4)},${gps.lon.toFixed(4)}`;
    const map = {
      sos: { priority: "sos", text: `SOS. ${me.name} needs immediate help at ${coords}.` },
      help: { priority: "medical", text: `Need help, not critical. ${me.name} at ${coords}.` },
      delayed: { priority: "ops", text: `Delayed, all safe. ${me.name} at ${coords}.` },
      safe: { priority: "normal", text: `Safe. ${me.name} at ${coords}.` },
    }[kind];
    await checkIn({ personId: me._id, lat: gps.lat, lon: gps.lon });
    const err = await send({ toType: "station", toId: "GOA", ...map, lat: gps.lat, lon: gps.lon });
    setFlash(err ?? (kind === "sos" ? "SOS queued at the front of the link. It goes on the next pass." : "Check-in queued for the next pass."));
  }

  const outgoing = (messages ?? []).filter((m) => m.outgoing).slice(0, 4);

  return (
    <div className="mx-auto grid max-w-md gap-4">
      {!online && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-sm text-white">
          <WifiOff size={16} /> Offline. Actions are kept on this phone and sent when a link opens.
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold">{me?.name ?? "Field team"}</h1>
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={12} />
          {gps ? `${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}${gps.simulated ? " (simulated position near Maitri)" : ""}` : "Locating…"}
        </p>
      </div>

      <button
        onClick={() => preset("sos")}
        disabled={!keyReady || !gps}
        className="grid aspect-square w-full place-items-center rounded-full bg-red-600 text-4xl font-bold tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.6)] transition active:scale-[0.98] disabled:opacity-50"
      >
        SOS
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => preset("safe")} className="grid place-items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-4 text-sm text-emerald-200 active:scale-[0.98]">
          <CircleCheck size={20} /> Safe
        </button>
        <button onClick={() => preset("delayed")} className="grid place-items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 py-4 text-sm text-amber-200 active:scale-[0.98]">
          <Clock3 size={20} /> Delayed
        </button>
        <button onClick={() => preset("help")} className="grid place-items-center gap-1 rounded-xl border border-red-500/40 bg-red-500/10 py-4 text-sm text-red-200 active:scale-[0.98]">
          <LifeBuoy size={20} /> Need help
        </button>
      </div>
      {flash && <p className="rounded-lg bg-navy-800 px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <PassCountdowns only="MAITRI" compact />

      {outgoing.length > 0 && me && (
        <ul className="grid gap-2">
          {outgoing.map((m) => <MessageRow key={m._id} m={m} me={me} now={now} />)}
        </ul>
      )}
    </div>
  );
}
