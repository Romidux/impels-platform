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
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
        secondary:
          "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        "danger-ghost":
          "text-red-600 hover:bg-red-50 hover:text-red-700",
        brand:
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm",
      },
      size: {
        sm: "text-xs px-3 py-1.5 rounded-lg",
        md: "text-sm px-4 py-2.5 rounded-lg",
        lg: "text-sm px-5 py-3 rounded-xl",
        icon: "p-2 rounded-lg",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
