import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ice-500 text-navy-950 hover:bg-ice-400",
        outline: "border border-navy-700 bg-transparent hover:bg-navy-800",
        danger: "bg-red-600 text-white hover:bg-red-500",
        ghost: "hover:bg-navy-800",
      },
      size: { default: "h-9 px-4", sm: "h-8 px-3", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
