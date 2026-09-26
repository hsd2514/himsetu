import { cn } from "@/lib/utils";

const control = "w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ice-400 focus:outline-none focus:ring-2 focus:ring-ice-400/30";

/** Label above input, optional hint and error below. */
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cn("grid gap-2 text-sm", className)}>
      <span className="text-slate-300">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, ...props }) {
  return <select className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, "min-h-24", className)} {...props} />;
}
