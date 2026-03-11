import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, ArrowRight, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product, Category } from "@/lib/types";
import ProductCard from "@/components/storefront/ProductCard";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*), store_branding(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = store.store_settings?.[0];

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store.id)
    .is("parent_id", null)
    .eq("is_active", true)
    .limit(6)
    .order("sort_order");

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)"
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .eq("is_featured", true)
    .limit(8)
    .order("created_at", { ascending: false });

  // Fetch recent products
  const { data: recentProducts } = await supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)"
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .limit(12)
    .order("created_at", { ascending: false });

  const primaryColor = settings?.primary_color || "#2563eb";
  const heroTitle = settings?.hero_title || `Bienvenidos a ${store.name}`;
  const heroSubtitle =
    settings?.hero_subtitle || "Descubre nuestros productos";
  const currency = settings?.currency || "Gs";

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-6"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}08 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1
            className="font-display text-5xl md:text-7xl font-black mb-4"
            style={{ color: primaryColor }}
          >
            {heroTitle}
          </h1>
          <p className="text-gray-600 text-xl mb-8">{heroSubtitle}</p>
          <Link
            href={`/store/${slug}/catalog`}
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            Ver catálogo completo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="py-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Categorías
            </h2>
            <Link
              href={`/store/${slug}/catalog`}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(categories as Category[]).map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/catalog?category=${cat.id}`}
                className="group"
              >
                <div
                  className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 text-white transition-all hover:scale-105 shadow-sm hover:shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}99)`,
                  }}
                >
                  <Tag className="w-7 h-7 opacity-80" />
                  <span className="font-semibold text-sm text-center px-2 leading-tight">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────── */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold text-gray-900">
                ⭐ Destacados
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(featuredProducts as Product[]).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={slug}
                  primaryColor={primaryColor}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ALL PRODUCTS ──────────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-gray-900">
            Todos los productos
          </h2>
          <Link
            href={`/store/${slug}/catalog`}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver catálogo completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {!recentProducts || recentProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-xl font-medium">
              Esta tienda aún no tiene productos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(recentProducts as Product[]).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={slug}
                primaryColor={primaryColor}
                currency={currency}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
