"use client";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useT } from "@/components/language-context";
import { useMe } from "@/components/use-me";
import { cn } from "@/lib/utils";

/** Unresolved alerts, on every screen. Critical ones are red, warnings amber. */
export function AlertBanner() {
  const alerts = useQuery(api.sos.openAlerts) ?? [];
  const resolve = useMutation(api.sos.resolve);
  const t = useT();
  const { me, can } = useMe();
  if (!alerts.length) return null;
  const top = alerts[0];
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2 text-sm font-medium backdrop-blur",
        top.severity === "critical"
          ? "border-red-500/30 bg-[color-mix(in_srgb,var(--panel)_82%,#ef4444)] text-red-200"
          : "border-amber-500/30 bg-[color-mix(in_srgb,var(--panel)_84%,#f59e0b)] text-amber-200"
      )}
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0" />
      <span className="truncate">{top.text}</span>
      {alerts.length > 1 && <span className="shrink-0 opacity-80">{t("+{n} more", { n: alerts.length - 1 })}</span>}
      {can("alert.resolve") && <button
        onClick={() => resolve({ id: top._id, actorId: me._id })}
        className="ml-auto flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/10"
      >
        <X size={14} /> {t("Resolve")}
      </button>}
    </div>
  );
}
