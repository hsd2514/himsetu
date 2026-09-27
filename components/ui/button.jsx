import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ice-500 text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-ice-400",
        outline: "border border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]",
        danger: "bg-red-600 text-[#fff] hover:bg-red-500",
        ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-slate-100",
      },
      size: { default: "h-9 px-4", sm: "h-8 px-3", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
