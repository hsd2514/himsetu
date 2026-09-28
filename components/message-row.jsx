"use client";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Check, CheckCheck, Clock, Lock, Satellite } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_TONE } from "@/components/link-queue";
import { useT } from "@/components/language-context";
import { decryptFor } from "@/lib/crypto";
import { fmtCountdown, fmtTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const STATUS = {
  queued: { icon: Clock, label: "Queued for next pass" },
  sent: { icon: Satellite, label: "Sent via satellite" },
  delivered: { icon: Check, label: "Delivered" },
  read: { icon: CheckCheck, label: "Read" },
};

function recipientLabel(m, t) {
  if (m.toType === "user") return t("one person");
  if (m.toType === "broadcast") return t("everyone");
  if (m.toType === "stakeholders") return t("all stakeholders");
  if (m.toType === "station") return t("station {code}", { code: m.toId });
  return t("a team");
}

export function MessageRow({ m, me, now }) {
  const [text, setText] = useState(null);
  const markRead = useMutation(api.messages.markRead);
  const t = useT();

  useEffect(() => {
    decryptFor(m, me._id).then(setText);
    if (!m.outgoing && m.status === "delivered" && !(m.readBy ?? []).includes(me._id)) markRead({ id: m._id, personId: me._id });
  }, [m, me._id, markRead]);

  const S = STATUS[m.status];
  return (
    <li className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", m.outgoing ? "ml-auto bg-ice-500/15" : "bg-white/[0.04]")}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span>{m.outgoing ? t("You to {target}", { target: recipientLabel(m, t) }) : m.fromName}</span>
        {m.priority !== "normal" && <Badge tone={PRIORITY_TONE[m.priority]}>{t(m.priority.toUpperCase())}</Badge>}
      </div>
      <div className="whitespace-pre-wrap text-slate-100">
        {text ?? <span className="flex items-center gap-1 text-slate-500"><Lock size={12} /> {t("Encrypted for another device")}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
        <S.icon size={12} className={m.status === "read" ? "text-ice-300" : ""} />
        {t(S.label)}
        {m.outgoing && m.recipientIds.length > 1 && (m.status === "delivered" || m.status === "read") && (
          <span>{t("read by {n} of {total}", { n: (m.readBy ?? []).length, total: m.recipientIds.length })}</span>
        )}
        {m.status === "queued" && m.releaseAt && <span className="font-mono">{t("in {time}", { time: fmtCountdown(m.releaseAt - now) })}</span>}
        <span className="ml-auto font-mono">{m.bytes} B · {fmtTime(m.queuedAt, m.fromStation)}</span>
      </div>
    </li>
  );
}
