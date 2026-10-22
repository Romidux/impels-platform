import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    /* Sin margen superior. El panel de contenido ya aporta 24px de padding
       arriba; sumarle mt-4 daba 40px de aire muerto antes del título en todas
       las pantallas del dashboard. El espacio de arriba lo define el panel, no
       el encabezado. */
    <div className={cn("mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-neutral-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm font-normal text-neutral-500">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
