"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import QRCode from "qrcode";
import { Printer, Flame, Snowflake } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useMe } from "@/components/use-me";
import { useT } from "@/components/language-context";

export default function NewCratePage() {
  const create = useMutation(api.crates.create);
  const { me } = useMe();
  const [form, setForm] = useState({ item: "Diesel drum #214", weightKg: "210", destination: "MAITRI", priority: "1", hazmat: true, coldChain: false });
  const [label, setLabel] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const t = useT();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const weight = Number(form.weightKg);
    if (!form.item.trim()) return setError(t("Give the crate a name."));
    if (!(weight > 0)) return setError(t("Weight must be above 0 kg."));
    setBusy(true);
    try {
      const { id, qrId } = await create({
        item: form.item.trim(),
        weightKg: weight,
        hazmat: form.hazmat,
        coldChain: form.coldChain,
        priority: Number(form.priority),
        destination: form.destination,
        scannedBy: me?.name ?? "Goa warehouse",
      });
      const png = await QRCode.toDataURL(qrId, { margin: 1, width: 320, color: { dark: "#050b18", light: "#ffffff" } });
      setLabel({ id, qrId, png, ...form, weightKg: weight });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={t("New crate")} subtitle={t("Tag it at the Goa warehouse. Every later scan builds its custody trail.")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="grid gap-4">
            <Field label={t("Item")}>
              <Input value={form.item} onChange={set("item")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("Weight (kg)")}>
                <Input type="number" min="0" step="0.1" value={form.weightKg} onChange={set("weightKg")} />
              </Field>
              <Field label={t("Destination")}>
                <Select value={form.destination} onChange={set("destination")}>
                  <option value="MAITRI">{t("Maitri")}</option>
                  <option value="BHARATI">{t("Bharati")}</option>
                </Select>
              </Field>
            </div>
            <Field label={t("Priority")} hint={t("Urgent crates are loaded last so they come off first.")}>
              <Select value={form.priority} onChange={set("priority")}>
                <option value="1">{t("1, urgent")}</option>
                <option value="2">{t("2, standard")}</option>
                <option value="3">{t("3, routine")}</option>
              </Select>
            </Field>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.hazmat} onChange={set("hazmat")} className="accent-ice-500" /> {t("Hazmat")}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.coldChain} onChange={set("coldChain")} className="accent-ice-500" /> {t("Cold chain")}</label>
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={busy}>{t(busy ? "Creating…" : "Create and print label")}</Button>
          </form>
        </Card>

        {label ? (
          <div className="grid content-start gap-3">
            <div id="print-label" className="rounded-xl bg-white p-5 text-navy-950">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={label.png} alt={`QR code for ${label.qrId}`} className="h-36 w-36" />
                <div className="grid gap-1">
                  <div className="text-xs font-semibold tracking-wide">HIMSETU · NCPOR GOA</div>
                  <div className="font-mono text-2xl font-bold">{label.qrId}</div>
                  <div className="text-sm">{label.item}</div>
                  <div className="text-sm">{label.weightKg} kg → {label.destination === "MAITRI" ? "Maitri" : "Bharati"}</div>
                  <div className="mt-1 flex gap-2 text-xs font-semibold">
                    {label.hazmat && <span className="flex items-center gap-1 rounded bg-amber-300 px-1.5 py-0.5"><Flame size={12} /> HAZMAT</span>}
                    {label.coldChain && <span className="flex items-center gap-1 rounded bg-sky-200 px-1.5 py-0.5"><Snowflake size={12} /> KEEP FROZEN</span>}
                    {label.priority === "1" && <span className="rounded bg-red-200 px-1.5 py-0.5">URGENT</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}><Printer size={14} /> {t("Print")}</Button>
              <Link href={`/cargo/${label.id}`} className="inline-flex h-9 items-center rounded-lg px-4 text-sm text-ice-300 hover:bg-navy-800">{t("Open timeline")}</Link>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
            {t("The QR label appears here after you create the crate.")}
          </div>
        )}
      </div>
    </>
  );
}
