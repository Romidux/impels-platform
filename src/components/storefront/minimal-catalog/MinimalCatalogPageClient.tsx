"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Store, StoreSettings, Category, Product } from "@/lib/types";
import MinimalCatalogToolbar from "./MinimalCatalogToolbar";
import MinimalFiltersDrawer from "./MinimalFiltersDrawer";
import MinimalCatalogGrid from "./MinimalCatalogGrid";
import MinimalCatalogProductCard from "./MinimalCatalogProductCard";
import MinimalEmptyState from "./MinimalEmptyState";
import { CatalogPagination } from "../shared/CatalogPagination";

interface MinimalCatalogPageClientProps {
  store: Store;
  settings?: StoreSettings;
  categories: Category[];
  initialProducts: Product[];
  /* `initialProducts` ahora es UNA página, no el catálogo entero. */
  page?: number;
  totalPages?: number;
  totalCount?: number;
}

export default function MinimalCatalogPageClient({
  store,
  settings,
  categories,
  initialProducts,
  page = 1,
  totalPages = 1,
  totalCount,
}: MinimalCatalogPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Get current filters from searchParams
  const activeCategoryId = searchParams.get("category");
  const activeSort = searchParams.get("sort") || "";
  const activeSearch = searchParams.get("search") || "";

  const primaryColor = settings?.primary_color || "#000000";
  const currency = settings?.currency || "Gs";
  const imageRatio = settings?.product_image_ratio || "4:5";

  const activeCategoryName = useMemo(() => {
    if (activeSearch) return `Resultados para "${activeSearch}"`;
    if (!activeCategoryId) return "Colección Completa";
    return categories.find((c) => c.id === activeCategoryId)?.name || "Categoría";
  }, [activeCategoryId, categories, activeSearch]);

  // Handle URL updates
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Cambiar un filtro vuelve a la página 1: la página 3 del resultado
    // anterior casi nunca existe en el nuevo.
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Link real por página, para que cada una sea una URL indexable.
  const hrefDePagina = (n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (n > 1) params.set("page", String(n));
    else params.delete("page");
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20 flex flex-col items-center">
        
        {/* Header Section */}
        <MinimalCatalogToolbar
          /* El total de la tienda, no el de la página: antes decía "24
             productos" cuando había 300. */
          totalCount={totalCount ?? initialProducts.length}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          sort={activeSort}
          onSortChange={(val) => updateParams({ sort: val || null })}
          activeCategoryName={activeCategoryName}
        />

        {/* Content Section */}
        <main className="w-full">
            {initialProducts.length === 0 ? (
              <div key="empty" className="animate-fade-in">
                <MinimalEmptyState storeSlug={store.slug} />
              </div>
            ) : (
              <div key="grid" className="animate-fade-in">
                <MinimalCatalogGrid>
                  {initialProducts.map((product) => (
                    <MinimalCatalogProductCard
                      key={product.id}
                      product={product}
                      storeSlug={store.slug}
                      currency={currency}
                      imageRatio={imageRatio}
                    />
                  ))}
                </MinimalCatalogGrid>

                <CatalogPagination
                  page={page}
                  totalPages={totalPages}
                  hrefFor={hrefDePagina}
                  primaryColor={primaryColor}
                />
              </div>
            )}
        </main>

        {/* Filters Drawer */}
        <MinimalFiltersDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
          selectedCategoryId={activeCategoryId}
          onSelectCategory={(id) => updateParams({ category: id })}
          primaryColor={primaryColor}
        />
      </div>
    </div>
  );
}
