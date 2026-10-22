import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md text-xs font-bold",
  {
    variants: {
      variant: {
        /* Chips sin borde: el fondo tintado ya separa el chip del fondo, y el
           borde sumaba una tercera línea en filas que ya tienen el borde de la
           tarjeta y el separador de fila.

           `success` y `brand` son el mismo verde a propósito — en este sistema
           "completado" es la marca. `trial` sale de violeta y `expired` de
           naranja: eran dos hues que no existían en ningún otro lado. */
        success: "bg-brand-100 text-brand-800",
        warning: "bg-[#fdf1da] text-[#b07d13]",
        error: "bg-[#fde3e3] text-[#c0453f]",
        info: "bg-neutral-100 text-neutral-700",
        neutral: "bg-neutral-100 text-neutral-600",
        brand: "bg-brand-100 text-brand-800",
        suspended: "bg-[#fde3e3] text-[#c0453f]",
        trial: "bg-brand-50 text-brand-700",
        expired: "bg-[#fdf1da] text-[#b07d13]",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
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

/* Los puntos siguen la misma reducción de paleta que los fondos de arriba:
   verde de marca, ámbar, rojo y gris. Sin azul, violeta ni naranja. */
const dotColors: Record<string, string> = {
  success: "bg-brand-600",
  warning: "bg-[#b07d13]",
  error: "bg-[#c0453f]",
  info: "bg-neutral-400",
  neutral: "bg-neutral-400",
  brand: "bg-brand-600",
  suspended: "bg-[#c0453f]",
  trial: "bg-brand-400",
  expired: "bg-[#b07d13]",
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
