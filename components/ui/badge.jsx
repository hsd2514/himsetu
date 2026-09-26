import { cn } from "@/lib/utils";

const TONES = {
  default: "border-navy-700 bg-navy-800 text-slate-300",
  ice: "border-ice-500/40 bg-ice-500/10 text-ice-300",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

export function Badge({ tone = "default", className, ...props }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", TONES[tone], className)} {...props} />;
}
