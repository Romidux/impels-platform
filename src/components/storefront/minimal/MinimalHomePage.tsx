"use client";

import { Store as StoreType, Category, Product, StoreSettings, StoreBranding } from "@/lib/types";
import Hero from "./Hero";
import CategoryStrip from "./CategoryStrip";
import ProductGrid from "./ProductGrid";

interface MinimalHomePageProps {
  store: StoreType;
  settings?: StoreSettings;
  branding?: StoreBranding;
  categories: Category[];
  featuredProducts: Product[];
  recentProducts: Product[];
}

export default function MinimalHomePage({
  store,
  settings,
  branding,
  categories,
  featuredProducts,
  recentProducts,
}: MinimalHomePageProps) {
  const currency = settings?.currency || "Gs";

  return (
    <div className="w-full flex flex-col items-center animate-fade-in bg-white">
      <Hero store={store} settings={settings} />
      <CategoryStrip storeSlug={store.slug} categories={categories} />
      
      {featuredProducts && featuredProducts.length > 0 && (
        <ProductGrid
          title="Destacados"
          products={featuredProducts}
          storeSlug={store.slug}
          currency={currency}
        />
      )}
      
      <div className="w-full border-t border-gray-100" />

      <ProductGrid
        title="Nueva Colección"
        products={recentProducts || []}
        storeSlug={store.slug}
        currency={currency}
      />
    </div>
  );
}
