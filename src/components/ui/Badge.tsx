import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border",
  {
    variants: {
      variant: {
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        error: "bg-red-50 text-red-700 border-red-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        neutral: "bg-gray-50 text-gray-600 border-gray-200",
        brand: "bg-brand-50 text-brand-700 border-brand-200",
        suspended: "bg-red-50 text-red-700 border-red-200",
        trial: "bg-purple-50 text-purple-700 border-purple-200",
        expired: "bg-orange-50 text-orange-700 border-orange-200",
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
