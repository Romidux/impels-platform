"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  Download,
  Plus,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface ProductForExport {
  name: string;
  price: number;
  show_price: boolean;
  visibility: string;
  stock_quantity: number;
  stock_status: string;
  track_inventory: boolean;
  has_variants: boolean;
  category?: { name: string } | null;
}

const SORT_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "name_desc", label: "Nombre Z-A" },
  { value: "price_asc", label: "Precio menor" },
  { value: "price_desc", label: "Precio mayor" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Oculto" },
] as const;

// --- Dropdown Button Component ---
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label;
  const hasValue = value !== "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap",
          hasValue
            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        {hasValue ? activeLabel : label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-50 min-w-[160px] py-1 animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                option.value === value
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Export CSV ---
function exportToCSV(products: ProductForExport[], currency: string) {
  const headers = ["Nombre", "Categoría", "Precio", "Stock", "Visibilidad"];
  const rows = products.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    p.category?.name || "Sin categoría",
    p.show_price ? p.price : "Consultar",
    p.has_variants
      ? "Variantes"
      : p.track_inventory
        ? p.stock_quantity
        : p.stock_status === "available"
          ? "Disponible"
          : "Sin stock",
    p.visibility === "visible" ? "Visible" : "Oculto",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main Component ---
export default function ProductFilters({
  categories,
  currentSearch,
  currentCategory,
  currentVisibility,
  currentView,
  currentSort,
  products,
  currency,
  atLimit,
}: {
  categories: Category[];
  currentSearch: string;
  currentCategory: string;
  currentVisibility: string;
  currentView: string;
  currentSort: string;
  products: ProductForExport[];
  currency: string;
  atLimit: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync search value when URL changes externally
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Always preserve view (or update if key === "view")
      if (key !== "view") {
        if (currentView) params.set("view", currentView);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`/dashboard/products?${params.toString()}`);
    },
    [router, searchParams, currentView]
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (currentView) params.set("view", currentView);
    router.push(`/dashboard/products?${params.toString()}`);
    setSearchValue("");
  }, [router, currentView]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilter("search", val);
    }, 400);
  };

  const clearSearch = () => {
    setSearchValue("");
    updateFilter("search", "");
  };

  // Build active filters for chips
  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (currentSearch) {
    activeFilters.push({
      key: "search",
      label: `Búsqueda: "${currentSearch}"`,
      value: currentSearch,
    });
  }
  if (currentCategory) {
    const catName =
      categories.find((c) => c.id === currentCategory)?.name || currentCategory;
    activeFilters.push({
      key: "category",
      label: `Categoría: ${catName}`,
      value: currentCategory,
    });
  }
  if (currentVisibility) {
    activeFilters.push({
      key: "visibility",
      label: `Visibilidad: ${currentVisibility === "visible" ? "Visible" : "Oculto"}`,
      value: currentVisibility,
    });
  }
  if (currentSort) {
    const sortLabel =
      SORT_OPTIONS.find((o) => o.value === currentSort)?.label || currentSort;
    activeFilters.push({
      key: "sort",
      label: `Orden: ${sortLabel}`,
      value: currentSort,
    });
  }

  const categoryOptions = [
    { value: "", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="dash-card p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Buscar productos..."
            className="w-full border border-slate-200 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
            style={{ padding: "0.5rem 2rem 0.5rem 2.25rem" }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Categorías"
            value={currentCategory}
            options={categoryOptions}
            onChange={(v) => updateFilter("category", v)}
          />

          <FilterDropdown
            label="Visibilidad"
            value={currentVisibility}
            options={[...VISIBILITY_OPTIONS]}
            onChange={(v) => updateFilter("visibility", v)}
          />

          <FilterDropdown
            label="Ordenar"
            value={currentSort}
            options={[...SORT_OPTIONS]}
            onChange={(v) => updateFilter("sort", v)}
          />

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-200" />

          {/* Export */}
          <button
            type="button"
            onClick={() => exportToCSV(products, currency)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>

          {/* New product button */}
          {atLimit ? (
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Upgrade
            </Link>
          ) : (
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </Link>
          )}

          {/* View toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => updateFilter("view", "list")}
              title="Vista de lista"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150",
                currentView === "list"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => updateFilter("view", "grid")}
              title="Vista de cuadrícula"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150",
                currentView === "grid"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                if (f.key === "search") {
                  clearSearch();
                } else {
                  updateFilter(f.key, "");
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              {f.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
