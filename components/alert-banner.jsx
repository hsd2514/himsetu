"use client";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

/** Unresolved alerts, on every screen. Critical ones are red, warnings amber. */
export function AlertBanner() {
  const alerts = useQuery(api.sos.openAlerts) ?? [];
  const resolve = useMutation(api.sos.resolve);
  if (!alerts.length) return null;
  const top = alerts[0];
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white",
        top.severity === "critical" ? "bg-red-700" : "bg-amber-700"
      )}
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span className="truncate">{top.text}</span>
      {alerts.length > 1 && <span className="shrink-0 opacity-80">+{alerts.length - 1} more</span>}
      <button
        onClick={() => resolve({ id: top._id })}
        className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/15"
      >
        <X size={14} /> Resolve
      </button>
    </div>
  );
}
