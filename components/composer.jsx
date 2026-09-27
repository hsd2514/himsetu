"use client";
import { useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { Lock, Send } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { encryptFor, getOrCreateKeypair, wireBytes } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const MAX_BYTES = 340;

/**
 * Encrypts in the browser, then hands ciphertext to the link. Shared by /messages and /field.
 * Returns an error string or null.
 */
export function useSend(me) {
  const convex = useConvex();
  const send = useMutation(api.messages.send);
  const t = useT();
  return async ({ toType, toId, priority, text, lat, lon }) => {
    if (!me) return t("Still loading your identity.");
    const recipients = await convex.query(api.messages.recipients, { toType, toId, fromId: me._id });
    const withKeys = recipients.filter((r) => r.publicKey);
    if (!withKeys.length) return t("No recipient has registered an encryption key yet. Open HIMSETU once as that node.");
    const own = await getOrCreateKeypair(me._id);
    const sealed = await encryptFor(text, [...withKeys, { _id: me._id, publicKey: own.publicKey }]);
    if (sealed.bytes > MAX_BYTES) return t("Too long: {n} of {max} bytes.", { n: sealed.bytes, max: MAX_BYTES });
    try {
      await send({ fromId: me._id, toType, toId, priority, ...sealed, lat, lon });
      return null;
    } catch (e) {
      return e.message.split("\n")[0];
    }
  };
}

export function Composer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const t = useT();
  const bytes = text ? wireBytes(text) : 0;
  const over = bytes > MAX_BYTES;

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || over) return;
    setBusy(true);
    const error = await onSend(text.trim());
    setBusy(false);
    setErr(error);
    if (!error) setText("");
  }

  return (
    <form onSubmit={submit} className="grid gap-2">
      <label className="sr-only" htmlFor="msg">{t("Message")}</label>
      <textarea
        id="msg"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("Write a short message. Satellite packets are small.")}
        className="min-h-20 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ice-400 focus:outline-none focus:ring-2 focus:ring-ice-400/30"
      />
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-300"><Lock size={12} /> {t("End-to-end encrypted")}</span>
        <span className={cn("font-mono", over ? "text-red-300" : "text-slate-400")}>{bytes} / {MAX_BYTES} B</span>
        <Button type="submit" size="sm" className="ml-auto" disabled={disabled || busy || !text.trim() || over}>
          <Send size={14} /> {t(busy ? "Encrypting…" : "Send")}
        </Button>
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </form>
  );
}
