"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Camera, CheckCircle2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { HOPS, HOP_LABEL } from "@/components/hop-progress";
import { useMe } from "@/components/use-me";

const DEFAULT_HOP = { GOA: "warehouse", SHIP: "ship_hold", MAITRI: "station", BHARATI: "station", FIELD: "station" };

export default function ScanPage() {
  const { me, node } = useMe();
  const scan = useMutation(api.crates.scan);
  const [qrId, setQrId] = useState("");
  const [hop, setHop] = useState(DEFAULT_HOP[node.code] ?? "port");
  const [camera, setCamera] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const crate = useQuery(api.crates.byQr, qrId.trim() ? { qrId } : "skip");
  const scannerRef = useRef(null);

  useEffect(() => setHop(DEFAULT_HOP[node.code] ?? "port"), [node.code]);

  useEffect(() => {
    if (!camera) return;
    let stopped = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (stopped) return;
      const s = new Html5Qrcode("qr-reader");
      scannerRef.current = s;
      s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (text) => {
          setQrId(text);
          setCamera(false);
        },
        () => {}
      ).catch((e) => {
        setError(`Camera unavailable: ${e?.message ?? e}. Type the label instead.`);
        setCamera(false);
      });
    });
    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (s?.isScanning) s.stop().catch(() => {});
    };
  }, [camera]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const id = await scan({ qrId, hop, scannedBy: me?.name ?? node.label });
      setDone({ id, qrId, hop });
      setQrId("");
    } catch (err) {
      setError(err.message.replace(/^.*Uncaught Error: /, "").split("\n")[0]);
    }
  }

  return (
    <>
      <PageHeader title="Scan handover" subtitle="Point the phone at the crate label, pick where it is, confirm." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="grid gap-4">
          <div id="qr-reader" className={camera ? "overflow-hidden rounded-lg" : "hidden"} />
          {!camera && (
            <Button type="button" variant="outline" size="lg" onClick={() => setCamera(true)}>
              <Camera size={18} /> Open camera
            </Button>
          )}
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Crate label" hint={crate ? crate.item : qrId ? "No crate with this label yet" : "Scanned automatically, or type it"}>
              <Input value={qrId} onChange={(e) => setQrId(e.target.value)} placeholder="HMS-1017" className="font-mono" />
            </Field>
            <Field label="Handover point">
              <Select value={hop} onChange={(e) => setHop(e.target.value)}>
                {HOPS.map((h) => <option key={h} value={h}>{HOP_LABEL[h]}</option>)}
              </Select>
            </Field>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={!crate}>Log handover</Button>
          </form>
        </Card>
        {done ? (
          <Card className="grid content-start gap-2 border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={18} /> Logged</div>
            <p className="text-sm text-slate-300">{done.qrId} is now at {HOP_LABEL[done.hop]}.</p>
            <Link href={`/cargo/${done.id}`} className="text-sm text-ice-300 hover:underline">View custody timeline</Link>
          </Card>
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-navy-700 p-8 text-center text-sm text-slate-400">
            Scanning as {me?.name ?? node.label}. The timeline updates live on every screen.
          </div>
        )}
      </div>
    </>
  );
}
