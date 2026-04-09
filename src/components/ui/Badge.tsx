import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border",
  {
    variants: {
      variant: {
        success: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
        warning: "bg-amber-50 text-amber-800 border-amber-200/60",
        error: "bg-red-50 text-red-800 border-red-200/60",
        info: "bg-blue-50 text-blue-800 border-blue-200/60",
        neutral: "bg-gray-50 text-gray-700 border-gray-200/60",
        brand: "bg-brand-50 text-brand-900 border-brand-200/60",
        suspended: "bg-red-50 text-red-800 border-red-200/60",
        trial: "bg-purple-50 text-purple-800 border-purple-200/60",
        expired: "bg-orange-50 text-orange-800 border-orange-200/60",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1",
        lg: "px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

const dotColors: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-400",
  brand: "bg-brand-500",
  suspended: "bg-red-500",
  trial: "bg-purple-500",
  expired: "bg-orange-500",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant || "neutral"])}
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
