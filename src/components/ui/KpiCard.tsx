import { cn } from "@/lib/utils";
import { ArrowUpRight, MoveUpRight, MoveDownRight } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  /** Se mantiene en la firma por compatibilidad, pero ya no se dibuja. */
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  /** Ocupa la misma esquina que `trend`; usar cuando hace falta un Badge propio. */
  badge?: React.ReactNode;
  href?: string;
  className?: string;
  iconClassName?: string;
  /** Tarjeta en verde sólido. Pensada para UNA sola por grilla: si se destacan
   *  varias, no se destaca ninguna. */
  highlight?: boolean;
}

/* Orden invertido respecto de la versión anterior: antes era icono grande
   arriba, número, label. Ahora es label arriba, número gigante, pie con la
   variación — que es el orden en que se lee un KPI (qué es, cuánto, cómo viene).

   El cuadro de icono de 44px desaparece: con cuatro tarjetas en fila, cuatro
   iconos de colores distintos competían con los números, que son el dato. En su
   lugar va una flecha ↗ discreta, que además sugiere que la tarjeta es un link. */
export function KpiCard({
  label,
  value,
  trend,
  badge,
  href,
  className,
  highlight = false,
}: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-bold",
            highlight ? "text-white" : "text-neutral-900"
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            highlight
              ? "border-white/45 text-white"
              : "border-neutral-200 text-neutral-900 group-hover:border-neutral-300"
          )}
        >
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
        </span>
      </div>

      <div
        className={cn(
          "mt-5 truncate text-[2.375rem] leading-none font-extrabold tracking-tight",
          highlight ? "text-white" : "text-neutral-900"
        )}
      >
        {value}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {badge ??
          (trend && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-0.5 rounded-md px-1 py-[2px] text-2xs font-bold",
                highlight
                  ? "bg-white/20 text-white"
                  : trend.positive
                    ? "bg-brand-100 text-brand-700"
                    : "bg-amber-50 text-amber-700"
              )}
            >
              {trend.positive ? (
                <MoveUpRight className="h-2 w-2 shrink-0" strokeWidth={3} />
              ) : (
                <MoveDownRight className="h-2 w-2 shrink-0" strokeWidth={3} />
              )}
              <span className="truncate">{trend.value}</span>
            </span>
          ))}
      </div>
    </>
  );

  const shell = cn(
    "group flex flex-col rounded-xl p-5",
    highlight
      ? "bg-brand-600"
      : href
        ? "dash-card-hover"
        : "dash-card",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn(shell, "block")}>
        {content}
      </Link>
    );
  }

  return <div className={shell}>{content}</div>;
}
