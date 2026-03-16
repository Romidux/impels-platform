import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/shared/ProductCard";
import { Package, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Product, Category } from "@/lib/types";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;
  const sp = await searchParams;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, store_settings(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;
  const primaryColor = settings?.primary_color || "#2563eb";
  const currency = settings?.currency || "Gs";

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("store_id", store.id)
    .is("parent_id", null)
    .eq("is_active", true)
    .order("sort_order");

  // Build product query
  let query = supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)"
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible");

  if (sp.category) {
    query = query.eq("category_id", sp.category);
  }
  if (sp.search) {
    query = query.ilike("name", `%${sp.search}%`);
  }

  // Sort
  switch (sp.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: products } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </h3>

          {/* Categories */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Categorías
            </p>
            <div className="space-y-1">
              <Link
                href={`/store/${slug}/catalog${sp.search ? `?search=${sp.search}` : ""}`}
                className={`block text-sm px-3 py-2 rounded-xl transition-colors ${
                  !sp.category
                    ? "font-bold text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={!sp.category ? { backgroundColor: primaryColor } : {}}
              >
                Todos
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/catalog?category=${cat.id}${sp.search ? `&search=${sp.search}` : ""}`}
                  className={`block text-sm px-3 py-2 rounded-xl transition-colors ${
                    sp.category === cat.id
                      ? "font-bold text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    sp.category === cat.id
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Ordenar por
            </p>
            <div className="space-y-1">
              {[
                { value: "", label: "Más recientes" },
                { value: "price_asc", label: "Precio: menor a mayor" },
                { value: "price_desc", label: "Precio: mayor a menor" },
              ].map((opt) => (
                <Link
                  key={opt.value}
                  href={`/store/${slug}/catalog?${[
                    sp.category && `category=${sp.category}`,
                    sp.search && `search=${sp.search}`,
                    opt.value && `sort=${opt.value}`,
                  ]
                    .filter(Boolean)
                    .join("&")}`}
                  className={`block text-sm px-3 py-2 rounded-xl transition-colors ${
                    (sp.sort || "") === opt.value
                      ? "font-bold text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    (sp.sort || "") === opt.value
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {sp.category
                ? categories?.find((c) => c.id === sp.category)?.name ||
                  "Productos"
                : sp.search
                  ? `Resultados para "${sp.search}"`
                  : "Catálogo completo"}
            </h1>
            <span className="text-sm text-gray-400">
              {products?.length || 0} productos
            </span>
          </div>

          {!products || products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">
                Sin productos encontrados
              </p>
              <Link
                href={`/store/${slug}/catalog`}
                className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block"
              >
                Ver todos los productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(products as Product[]).map((product) => (
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
        </div>
      </div>
    </div>
  );
}
