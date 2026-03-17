import { PackageSearch } from "lucide-react";
import Link from "next/link";

interface MinimalEmptyStateProps {
  storeSlug: string;
}

export default function MinimalEmptyState({ storeSlug }: MinimalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 sm:py-32 px-4 text-center">
      <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-8">
        <PackageSearch className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-medium text-neutral-900 mb-2 tracking-tight">
        No se encontraron productos
      </h3>
      <p className="text-neutral-500 font-light max-w-xs mx-auto mb-10 leading-relaxed text-sm">
        Intenta ajustar los filtros o el término de búsqueda para encontrar lo que buscas.
      </p>
      <Link
        href={`/store/${storeSlug}/catalog`}
        className="text-[11px] uppercase tracking-[0.2em] font-medium px-8 py-3.5 bg-neutral-900 text-white hover:bg-black transition-all"
      >
        Limpiar Filtros
      </Link>
    </div>
  );
}
