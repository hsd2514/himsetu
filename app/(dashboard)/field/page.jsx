"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { pushOutbox, readOutbox, writeOutbox } from "@/lib/outbox";
import { useMutation, useQuery } from "convex/react";
import { CircleCheck, Clock3, LifeBuoy, MapPin, WifiOff } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PassCountdowns } from "@/components/pass-countdown";
import { useSend } from "@/components/composer";
import { MessageRow } from "@/components/message-row";
import { useMe, useNow } from "@/components/use-me";
import { useT } from "@/components/language-context";
import { NotAllowed } from "@/components/not-allowed";

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
  const { me, keyReady, can } = useMe();
  const gps = useGps();
  const send = useSend(me);
  const checkIn = useMutation(api.sos.checkIn);
  const messages = useQuery(api.messages.forPerson, me ? { personId: me._id } : "skip");
  const now = useNow(1000);
  const [online, setOnline] = useState(true);
  const [flash, setFlash] = useState(null);
  const [pending, setPending] = useState(0);
  const flushing = useRef(false);
  const t = useT();

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

  /** Check in and send one action over the link. Returns an error string or null. */
  const deliver = useCallback(
    async (item) => {
      await checkIn({ personId: me._id, lat: item.lat, lon: item.lon });
      return send({ toType: "stakeholders", toId: "all", priority: item.priority, text: item.text, lat: item.lat, lon: item.lon });
    },
    [me, checkIn, send]
  );

  /** Send everything saved while offline, oldest first; stop at the first failure. */
  const flush = useCallback(async () => {
    if (flushing.current || !me || !navigator.onLine) return;
    flushing.current = true;
    let items = readOutbox();
    while (items.length) {
      const err = await deliver(items[0]).catch((e) => e.message);
      if (err) break;
      items = items.slice(1);
      writeOutbox(items);
    }
    setPending(items.length);
    flushing.current = false;
  }, [me, deliver]);

  useEffect(() => {
    setPending(readOutbox().length);
    if (online && keyReady) flush();
  }, [online, keyReady, flush]);

  async function preset(kind) {
    if (!me || !gps) return;
    const coords = `${gps.lat.toFixed(4)},${gps.lon.toFixed(4)}`;
    // Message text stays English: Devanagari is 3 bytes a letter against the 340-byte packet.
    const map = {
      sos: { priority: "sos", text: `SOS. ${me.name} needs immediate help at ${coords}.` },
      help: { priority: "medical", text: `Need help, not critical. ${me.name} at ${coords}.` },
      delayed: { priority: "ops", text: `Delayed, all safe. ${me.name} at ${coords}.` },
      safe: { priority: "normal", text: `Safe. ${me.name} at ${coords}.` },
    }[kind];
    const item = { ...map, lat: gps.lat, lon: gps.lon, ts: Date.now() };
    if (!navigator.onLine) {
      // Stamp the real time so Goa knows when it happened, not when it arrived.
      const hhmm = new Date(item.ts).toISOString().slice(11, 16);
      setPending(pushOutbox({ ...item, text: `${item.text} Logged ${hhmm} UTC.` }).length);
      setFlash(t("No network. Saved on this phone; it sends as soon as the link is back."));
      return;
    }
    const err = await deliver(item);
    setFlash(err ?? t(kind === "sos" ? "SOS queued at the front of the link. It goes on the next pass." : "Check-in queued for the next pass."));
  }

  const outgoing = (messages ?? []).filter((m) => m.outgoing).slice(0, 4);

  if (me && !can("field.report")) return <NotAllowed role={me.role} what="send field reports" />;

  return (
    <div className="mx-auto grid max-w-md gap-4">
      {!online && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-sm text-[#fff]">
          <WifiOff size={16} /> {t("Offline. Actions are kept on this phone and sent when a link opens.")}
        </div>
      )}
      {pending > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {t("{n} action(s) saved on this phone, waiting for network.", { n: pending })}
        </div>
      )}
      <div>
        <h1 className="text-xl font-semibold">{me?.name ?? t("Field team")}</h1>
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={12} />
          {gps ? `${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}${gps.simulated ? ` ${t("(simulated position near Maitri)")}` : ""}` : t("Locating…")}
        </p>
      </div>

      <button
        onClick={() => preset("sos")}
        disabled={!keyReady || !gps}
        className="grid aspect-square w-full place-items-center rounded-full bg-red-600 text-4xl font-bold tracking-widest text-[#fff] shadow-[0_20px_60px_-15px_rgba(220,38,38,0.6)] transition active:scale-[0.98] disabled:opacity-50"
      >
        SOS
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => preset("safe")} className="grid place-items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-4 text-sm text-emerald-200 active:scale-[0.98]">
          <CircleCheck size={20} /> {t("Safe")}
        </button>
        <button onClick={() => preset("delayed")} className="grid place-items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 py-4 text-sm text-amber-200 active:scale-[0.98]">
          <Clock3 size={20} /> {t("Delayed")}
        </button>
        <button onClick={() => preset("help")} className="grid place-items-center gap-1 rounded-xl border border-red-500/40 bg-red-500/10 py-4 text-sm text-red-200 active:scale-[0.98]">
          <LifeBuoy size={20} /> {t("Need help")}
        </button>
      </div>
      {flash && <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-slate-200">{flash}</p>}

      <PassCountdowns only="MAITRI" compact />

      {outgoing.length > 0 && me && (
        <ul className="grid gap-2">
          {outgoing.map((m) => <MessageRow key={m._id} m={m} me={me} now={now} />)}
        </ul>
      )}
    </div>
  );
}
