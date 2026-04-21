"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  Download,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface InventoryProductForExport {
  name: string;
  price: number;
  stock_quantity: number;
  category?: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "ok", label: "En stock" },
  { value: "low", label: "Stock bajo" },
  { value: "out", label: "Sin stock" },
] as const;

const SORT_OPTIONS = [
  { value: "", label: "Stock (menor)" },
  { value: "stock_desc", label: "Stock (mayor)" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "name_desc", label: "Nombre Z-A" },
  { value: "value_desc", label: "Mayor valor" },
  { value: "value_asc", label: "Menor valor" },
] as const;

// --- Dropdown Button ---
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
          "inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium rounded-[12px] transition-colors whitespace-nowrap border-0",
          hasValue
            ? "bg-[#F0F6FF] text-[#0071E3] hover:bg-[#E0EEFF]"
            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EBEBED]"
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
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_24px_rgba(0,0,0,0.10)] z-50 min-w-[160px] py-1.5 animate-fade-in">
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
                  ? "bg-[#F0F6FF] text-[#0071E3] font-medium"
                  : "text-[#1D1D1F] hover:bg-[#F5F5F7]"
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
function exportInventoryCSV(products: InventoryProductForExport[], currency: string) {
  const headers = ["Nombre", "Categoría", "Stock", "Precio unit.", "Valor stock"];
  const rows = products.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    p.category?.name || "Sin categoría",
    p.stock_quantity,
    p.price,
    p.stock_quantity * p.price,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main Component ---
export default function InventoryFilters({
  categories,
  currentSearch,
  currentCategory,
  currentStatus,
  currentSort,
  products,
  currency,
}: {
  categories: Category[];
  currentSearch: string;
  currentCategory: string;
  currentStatus: string;
  currentSort: string;
  products: InventoryProductForExport[];
  currency: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      params.delete("page");
      router.push(`/dashboard/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    router.push("/dashboard/inventory");
    setSearchValue("");
  }, [router]);

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
  const activeFilters: { key: string; label: string }[] = [];
  if (currentSearch) {
    activeFilters.push({ key: "search", label: `Búsqueda: "${currentSearch}"` });
  }
  if (currentCategory) {
    const catName = categories.find((c) => c.id === currentCategory)?.name || currentCategory;
    activeFilters.push({ key: "category", label: `Categoría: ${catName}` });
  }
  if (currentStatus) {
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label || currentStatus;
    activeFilters.push({ key: "status", label: `Estado: ${statusLabel}` });
  }
  if (currentSort) {
    const sortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label || currentSort;
    activeFilters.push({ key: "sort", label: `Orden: ${sortLabel}` });
  }

  const categoryOptions = [
    { value: "", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-white border border-[#E5E5EA] rounded-[20px] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Buscar en inventario..."
            className="w-full h-10 pl-9 pr-8 border border-[#E5E5EA] rounded-[12px] bg-white text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all duration-200"
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Estado"
            value={currentStatus}
            options={[...STATUS_OPTIONS]}
            onChange={(v) => updateFilter("status", v)}
          />

          <FilterDropdown
            label="Categoría"
            value={currentCategory}
            options={categoryOptions}
            onChange={(v) => updateFilter("category", v)}
          />

          <FilterDropdown
            label="Ordenar"
            value={currentSort}
            options={[...SORT_OPTIONS]}
            onChange={(v) => updateFilter("sort", v)}
          />

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-[#E5E5EA]" />

          {/* Export */}
          <button
            type="button"
            onClick={() => exportInventoryCSV(products, currency)}
            className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium rounded-[12px] bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EBEBED] transition-colors whitespace-nowrap border-0"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
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
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-[#F0F6FF] text-[#0071E3] border border-[#0071E3]/15 hover:bg-[#E0EEFF] transition-colors"
            >
              {f.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
