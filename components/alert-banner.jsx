"use client";
import { AlertTriangle } from "lucide-react";

/** Red banner for unresolved alerts. Wired to the alerts table in Phase 3. */
export function AlertBanner({ alerts = [] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex items-center gap-2 bg-red-700 px-4 py-2 text-sm font-medium text-white">
      <AlertTriangle size={16} /> {alerts[0].text}
      {alerts.length > 1 && <span className="opacity-80">(+{alerts.length - 1} more)</span>}
    </div>
  );
}
