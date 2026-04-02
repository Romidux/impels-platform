"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback } from "react";

interface Category {
  id: string;
  name: string;
}

export default function ProductFilters({
  categories,
  currentSearch,
  currentCategory,
  currentVisibility,
  currentView,
}: {
  categories: Category[];
  currentSearch: string;
  currentCategory: string;
  currentVisibility: string;
  currentView: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Preserve view mode
      if (currentView) params.set("view", currentView);
      router.push(`/dashboard/products?${params.toString()}`);
    },
    [router, searchParams, currentView]
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateFilter("search", formData.get("search") as string);
  };

  return (
    <div className="dash-card p-4 flex flex-1 flex-col sm:flex-row gap-3">
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="Buscar productos..."
          className="dash-input pl-9 w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const form = e.currentTarget.closest("form");
              if (form) form.requestSubmit();
            }
          }}
        />
      </form>
      <select
        value={currentCategory}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="dash-input bg-white w-auto min-w-[180px]"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={currentVisibility}
        onChange={(e) => updateFilter("visibility", e.target.value)}
        className="dash-input bg-white w-auto min-w-[140px]"
      >
        <option value="">Visibilidad</option>
        <option value="visible">Visible</option>
        <option value="hidden">Oculto</option>
      </select>
    </div>
  );
}
