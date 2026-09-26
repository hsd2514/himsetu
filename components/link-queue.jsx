"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useNow } from "@/components/use-me";
import { fmtCountdown } from "@/lib/time";

export const PRIORITY_TONE = { sos: "red", medical: "amber", ops: "ice", normal: "default" };

/** Messages waiting for a satellite window, in the order the link will send them. */
export function LinkQueue() {
  const queue = useQuery(api.messages.queue);
  const now = useNow(1000);
  if (queue === undefined) return <div className="mt-3 h-24 animate-pulse rounded-lg bg-navy-800" />;
  if (!queue.length) return <p className="mt-3 text-sm text-slate-400">Nothing waiting. New messages from the ice queue here until the next pass.</p>;
  return (
    <ol className="mt-3 grid gap-2">
      {queue.map((m, i) => (
        <li key={m._id} className="flex items-center gap-3 rounded-lg bg-navy-800 px-3 py-2 text-sm">
          <span className="w-4 font-mono text-xs text-slate-500">{i + 1}</span>
          <Badge tone={PRIORITY_TONE[m.priority]}>{m.priority.toUpperCase()}</Badge>
          <span className="text-slate-300">{m.fromStation}</span>
          <span className="font-mono text-xs text-slate-500">{m.bytes} B</span>
          {m.attempts > 0 && <span className="text-xs text-amber-300">retry {m.attempts}</span>}
          <span className="ml-auto font-mono text-xs text-slate-400">
            {m.releaseAt ? fmtCountdown(m.releaseAt - now) : "waiting"}
          </span>
        </li>
      ))}
    </ol>
  );
}
