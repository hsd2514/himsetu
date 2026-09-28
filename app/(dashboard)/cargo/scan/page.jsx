"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Camera, CameraOff, CheckCircle2, Flame, ScanLine, Snowflake, TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { HOPS, HOP_LABEL, HopProgress } from "@/components/hop-progress";
import { QrScanner, cameraSupported } from "@/components/qr-scanner";
import { NotAllowed } from "@/components/not-allowed";
import { useMe } from "@/components/use-me";

const DEFAULT_HOP = { GOA: "warehouse", SHIP: "ship_hold", MAITRI: "station", BHARATI: "station", FIELD: "station" };
const PLACE = { MAITRI: "Maitri", BHARATI: "Bharati" };

/** Where this node usually logs crates, if that is still ahead of the crate; else its next hop. */
function suggestHop(status, nodeCode) {
  const at = HOPS.indexOf(status);
  const usual = DEFAULT_HOP[nodeCode];
  return usual && HOPS.indexOf(usual) > at ? usual : HOPS[at + 1];
}

export default function ScanPage() {
  const { me, node, can } = useMe();
  const scan = useMutation(api.crates.scan);
  const [qrId, setQrId] = useState("");
  const [hop, setHop] = useState("");
  const [note, setNote] = useState("");
  const [camera, setCamera] = useState(false);
  const [canCamera, setCanCamera] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [logged, setLogged] = useState([]);
  const label = qrId.trim();
  const crate = useQuery(api.crates.byQr, label ? { qrId: label } : "skip");

  useEffect(() => setCanCamera(cameraSupported()), []);

  // Pre-select the hop that makes sense for this crate at this node.
  const at = crate ? HOPS.indexOf(crate.status) : -1;
  useEffect(() => {
    setHop(crate ? suggestHop(crate.status, node.code) ?? "" : "");
  }, [crate?._id, crate?.status, node.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const delivered = crate?.status === "station";
  const wrongStation = crate && hop === "station" && PLACE[node.code] && crate.destination !== node.code;

  function onScan(text) {
    setCamera(false);
    setError(null);
    setQrId(text.trim().toUpperCase());
  }

  async function submit(e) {
    e.preventDefault();
    if (!crate || !hop || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await scan({ qrId: label, hop, note: note.trim() || undefined });
      setLogged((l) => [res, ...l].slice(0, 6));
      setQrId("");
      setNote("");
    } catch (err) {
      setError(err.message.replace(/^.*Uncaught Error: /s, "").split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  if (me && !can("crate.scan")) return <NotAllowed role={me.role} what="log cargo handovers" />;

  return (
    <>
      <PageHeader title="Scan handover" subtitle="Point the phone at the crate label, check the hop, confirm." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="grid content-start gap-4">
          {camera ? (
            <>
              <QrScanner onScan={onScan} onError={(msg) => { setError(msg); setCamera(false); }} />
              <Button type="button" variant="ghost" onClick={() => setCamera(false)}>
                <CameraOff size={16} /> Close camera
              </Button>
            </>
          ) : canCamera ? (
            <Button type="button" variant="outline" size="lg" onClick={() => { setError(null); setCamera(true); }}>
              <Camera size={18} /> {logged.length ? "Scan next crate" : "Open camera"}
            </Button>
          ) : (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              The camera needs a secure (https://) connection. Type the label below, or open HIMSETU over https on this phone.
            </p>
          )}

          <form onSubmit={submit} className="grid gap-4">
            <Field label="Crate label" hint={label && crate === null ? "No crate with this label" : "Scanned automatically, or type it"}>
              <Input
                value={qrId}
                onChange={(e) => setQrId(e.target.value.toUpperCase())}
                placeholder="HMS-1017"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </Field>
            <Field label="Handover point" hint={crate && !delivered ? `Now at ${HOP_LABEL[crate.status]}; custody only moves forward.` : undefined}>
              <Select value={hop} onChange={(e) => setHop(e.target.value)} disabled={!crate || delivered}>
                {!crate && <option value="">Scan a crate first</option>}
                {HOPS.map((h, i) => (
                  <option key={h} value={h} disabled={crate ? i <= at : false}>{HOP_LABEL[h]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Note (optional)" hint="Seal intact, drum dented, kept below −18 °C…">
              <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} disabled={!crate || delivered} />
            </Field>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <Button type="submit" size="lg" disabled={!crate || delivered || !hop || busy}>
              {busy ? "Logging…" : hop ? `Log at ${HOP_LABEL[hop]}` : "Log handover"}
            </Button>
          </form>
        </Card>

        <div className="grid content-start gap-4">
          {crate ? (
            <Card className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-ice-300">{crate.qrId}</div>
                  <div className="text-lg font-semibold">{crate.item}</div>
                  <div className="text-xs text-slate-400">{crate.weightKg} kg → {PLACE[crate.destination] ?? crate.destination}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {crate.priority === 1 && <Badge tone="red">Urgent</Badge>}
                  {crate.hazmat && <Badge tone="amber"><Flame size={11} /> Hazmat</Badge>}
                  {crate.coldChain && <Badge tone="ice"><Snowflake size={11} /> Cold chain</Badge>}
                </div>
              </div>
              <HopProgress status={crate.status} />
              {delivered && <p className="text-sm text-emerald-300">Delivered. Custody is complete for this crate.</p>}
              {wrongStation && (
                <p className="flex items-center gap-2 text-sm text-amber-300">
                  <TriangleAlert size={14} /> Bound for {PLACE[crate.destination]}, not {PLACE[node.code]}. Check before logging.
                </p>
              )}
              <Link href={`/cargo/${crate._id}`} className="text-sm text-ice-300 hover:underline">View custody timeline</Link>
            </Card>
          ) : (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              <ScanLine size={22} className="text-slate-500" />
              Scanning as {me?.name ?? node.label}. The timeline updates live on every screen.
            </div>
          )}

          {logged.length > 0 && (
            <Card>
              <CardTitle>Logged this session</CardTitle>
              <ul className="mt-3 grid gap-2">
                {logged.map((r, i) => (
                  <li key={`${r.id}-${r.hop}`} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} className={i === 0 ? "text-emerald-300" : "text-slate-500"} />
                    <Link href={`/cargo/${r.id}`} className="font-mono text-xs text-ice-300 hover:underline">{r.qrId}</Link>
                    <span className="truncate text-slate-300">{r.item}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-400">{HOP_LABEL[r.hop]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
