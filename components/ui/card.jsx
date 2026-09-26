import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-navy-700 bg-navy-900/80 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-xs font-medium uppercase tracking-wide text-ice-300", className)} {...props} />;
}
