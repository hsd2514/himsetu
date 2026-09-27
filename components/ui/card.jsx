import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("surface rounded-2xl p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-sm font-medium text-slate-200", className)} {...props} />;
}
