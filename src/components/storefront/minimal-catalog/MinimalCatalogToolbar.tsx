"use client";

import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

interface MinimalCatalogToolbarProps {
  totalCount: number;
  onOpenFilters: () => void;
  sort: string;
  onSortChange: (val: string) => void;
  activeCategoryName: string;
}

export default function MinimalCatalogToolbar({
  totalCount,
  onOpenFilters,
  sort,
  onSortChange,
  activeCategoryName,
}: MinimalCatalogToolbarProps) {
  return (
    <div className="w-full mb-12 sm:mb-16">
      {/* Page Title & Count */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-neutral-900 mb-2">
             {activeCategoryName}
           </h1>
           <p className="text-sm text-neutral-400 font-light italic">
             Mostrando {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
           </p>
        </div>
      </div>


      {/* Filter / Sort Bar */}
      <div className="flex items-center justify-between border-y border-neutral-100 py-5">
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center group-hover:border-neutral-900 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors stroke-[1.5]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">
            Filtros
          </span>
        </button>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-transparent pr-8 pl-0 py-2 text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-600 focus:outline-none cursor-pointer hover:text-neutral-900 transition-colors"
            >
              <option value="">Más recientes</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A-Z</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none stroke-[1.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
