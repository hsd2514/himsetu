"use client";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const HOPS = ["warehouse", "port", "ship_hold", "helideck", "station"];
export const HOP_LABEL = {
  warehouse: "Goa warehouse",
  port: "Cape Town port",
  ship_hold: "Ship hold",
  helideck: "Helideck",
  station: "At station",
};

/** Five segments, filled up to the crate's current hop. */
export function HopProgress({ status }) {
  const at = HOPS.indexOf(status);
  const t = useT();
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-5 gap-1">
        {HOPS.map((h, i) => (
          <span key={h} className={cn("h-1.5 rounded-full", i <= at ? "bg-ice-400" : "bg-navy-700")} />
        ))}
      </div>
      <span className="text-[11px] text-slate-400">{t(HOP_LABEL[status])}</span>
    </div>
  );
}
