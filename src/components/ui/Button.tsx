import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Dos cambios de fondo respecto de la versión anterior:
   1. El peso base es `medium`, no `semibold`. Un botón no necesita gritar para
      leerse como botón, y con semibold competía con los títulos de sección.
   2. Los tamaños fijan ALTURA en vez de padding vertical. Con `py-*` la altura
      dependía del tamaño de fuente, así que un Button md (40px) nunca alineaba
      con un .dash-input (42px) en la misma fila. Ahora md e input miden 40px. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors",
        // El borde es neutral-200, no white/80: antes era un borde blanco sobre
        // fondo blanco, o sea invisible, y el botón solo existía por la sombra.
        secondary:
          "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors",
        ghost:
          "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors",
        danger:
          "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors",
        "danger-ghost":
          "text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors",
        brand:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-11 px-5 text-sm rounded-lg",
        icon: "size-10 rounded-lg",
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
