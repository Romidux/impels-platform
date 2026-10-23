import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/shared/ProductCard";
import { Package, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/types";
import TemplateDispatcher from "@/components/storefront/TemplateDispatcher";
import { getStoreBySlug, getStoreCategories } from "@/lib/queries/store";
import { CatalogPagination } from "@/components/storefront/shared/CatalogPagination";

/* 24 por página: con el tope de 10 productos del plan gratis, esas tiendas
   nunca ven una segunda página. Las tiendas con catálogo grande sí. */
const CATALOG_PAGE_SIZE = 24;

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const store = await getStoreBySlug(slug); // Cached
  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;
  const primaryColor = settings?.primary_color || "#2563eb";
  const currency = settings?.currency || "Gs";
  const template = settings?.template || "modern";

  // Fetch categories (cached)
  const categories = await getStoreCategories(store.id, true);

  // Build product query (not cached — depends on search params)
  const supabase = await createClient();

  // Build product query
  let query = supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)",
      { count: "exact" }
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible");

  if (sp.category) {
    query = query.eq("category_id", sp.category);
  }
  if (sp.search) {
    query = query.ilike("name", `%${sp.search}%`);
  }

  // Sort logic for server-side initial load
  switch (sp.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Antes la consulta traía TODOS los productos visibles de la tienda, con
  // todas sus columnas y sin tope. Con 20 productos no se notaba; con 500 era
  // el techo de escalabilidad del storefront.
  const page = Math.max(1, Number(sp.page) || 1);
  const desde = (page - 1) * CATALOG_PAGE_SIZE;

  const { data: products, count: totalCount } = await query.range(
    desde,
    desde + CATALOG_PAGE_SIZE - 1
  );

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  // La paginación tiene que arrastrar los filtros: sin esto, pasar a la página
  // 2 estando filtrado por una categoría devuelve la página 2 del catálogo
  // entero.
  const hrefDePagina = (n: number) => {
    const params = new URLSearchParams();
    if (sp.category) params.set("category", sp.category);
    if (sp.search) params.set("search", sp.search);
    if (sp.sort) params.set("sort", sp.sort);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `/store/${slug}/catalog${qs ? `?${qs}` : ""}`;
  };

  // Use TemplateDispatcher to render the correct UI
  // If dispatcher returns null, we use the shared/legacy UI as fallback
  if (template === "minimal") {
    return (
      <TemplateDispatcher
        type="catalog"
        template={template}
        store={store}
        settings={settings}
        categories={categories || []}
        allProducts={(products as Product[]) || []}
        page={page}
        totalPages={totalPages}
        totalCount={total}
      />
    );
  }

  // Fallback / Shared UI for other templates
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
              {total} {total === 1 ? "producto" : "productos"}
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

          <CatalogPagination
            page={page}
            totalPages={totalPages}
            hrefFor={hrefDePagina}
            primaryColor={primaryColor}
          />
        </div>
      </div>
    </div>
  );
}

