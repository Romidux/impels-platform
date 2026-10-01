import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white font-semibold shadow-apple-sm hover:bg-brand-700 active:bg-brand-800 transition-colors",
        secondary:
          "bg-white text-slate-600 font-semibold border border-white/80 shadow-apple-sm hover:bg-white hover:shadow-apple-md transition-all",
        ghost:
          "text-slate-500 font-medium hover:bg-white/60 hover:text-slate-700 transition-colors",
        danger:
          "bg-red-50 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-colors",
        "danger-ghost":
          "text-red-600 font-medium hover:bg-red-50 hover:text-red-700 transition-colors",
        brand:
          "bg-brand-600 text-white font-semibold shadow-apple-sm hover:bg-brand-700 active:bg-brand-800 transition-colors",
      },
      size: {
        sm: "text-xs px-3 py-1.5 rounded-xl",
        md: "text-sm px-5 py-2.5 rounded-xl",
        lg: "text-sm px-6 py-3 rounded-xl",
        icon: "p-2 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : icon}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
