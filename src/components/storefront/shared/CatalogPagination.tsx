import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginación del catálogo del storefront.
 *
 * Sin hooks y sin "use client" a propósito: así sirve tanto dentro del cliente
 * del catálogo minimal como en el render de servidor de los otros templates.
 *
 * Son <Link> reales, no botones con router.push, porque cada página tiene que
 * ser una URL que Google pueda seguir e indexar. Con scroll infinito o con
 * botones, el buscador ve solo la primera tanda de productos.
 */

function ventanaDePaginas(actual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas: (number | "…")[] = [1];
  const desde = Math.max(2, actual - 1);
  const hasta = Math.min(total - 1, actual + 1);

  if (desde > 2) paginas.push("…");
  for (let p = desde; p <= hasta; p++) paginas.push(p);
  if (hasta < total - 1) paginas.push("…");

  paginas.push(total);
  return paginas;
}

const microTexto =
  "text-[11px] uppercase tracking-[0.2em] font-medium transition-colors";

export function CatalogPagination({
  page,
  totalPages,
  hrefFor,
  primaryColor = "#000000",
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  primaryColor?: string;
}) {
  if (totalPages <= 1) return null;

  const hayAnterior = page > 1;
  const haySiguiente = page < totalPages;

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-16 flex items-center justify-between gap-4 border-t border-neutral-100 pt-10 sm:mt-20"
    >
      {hayAnterior ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={`group flex items-center gap-2 text-neutral-600 hover:text-neutral-900 ${microTexto}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 transition-colors group-hover:border-neutral-900">
            <ChevronLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
          <span className="hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span className={`flex items-center gap-2 text-neutral-300 ${microTexto}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-100">
            <ChevronLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
          <span className="hidden sm:inline">Anterior</span>
        </span>
      )}

      {/* gap y puntos más apretados en pantallas chicas: el peor caso
          (‹ 1 ··· 5 6 7 ··· 12 ›) se pasaba 24px de un viewport de 375. */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {ventanaDePaginas(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`sep-${i}`}
              className="px-0 sm:px-1 text-[11px] text-neutral-300 select-none"
            >
              ·&thinsp;·&thinsp;·
            </span>
          ) : p === page ? (
            <span
              key={p}
              aria-current="page"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {p}
            </Link>
          )
        )}
      </div>

      {haySiguiente ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={`group flex items-center gap-2 text-neutral-600 hover:text-neutral-900 ${microTexto}`}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 transition-colors group-hover:border-neutral-900">
            <ChevronRight className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
        </Link>
      ) : (
        <span className={`flex items-center gap-2 text-neutral-300 ${microTexto}`}>
          <span className="hidden sm:inline">Siguiente</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-100">
            <ChevronRight className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
        </span>
      )}
    </nav>
  );
}
