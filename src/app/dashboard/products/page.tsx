import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import Link from "next/link";
import {
  Plus,
  Package,
  ImageIcon,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import ProductsActions from "@/components/dashboard/ProductsActions";
import VisibilityDropdown from "@/components/dashboard/VisibilityDropdown";
import { PageHeader } from "@/components/ui/PageHeader";
import ProductFilters from "@/components/dashboard/ProductFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; visibility?: string; featured?: string; page?: string; sort?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const store = await getStore(user.id);
  if (!store) redirect("/onboarding");

  const supabase = await createClient();

  const params = await searchParams;
  const { search, category, visibility, featured } = params;
  const sort = params.sort || "";
  const page = parseInt(params.page || "1");
  const pageSize = 15;

  // Build sort
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    oldest: { column: "created_at", ascending: true },
    name_asc: { column: "name", ascending: true },
    name_desc: { column: "name", ascending: false },
    price_asc: { column: "price", ascending: true },
    price_desc: { column: "price", ascending: false },
  };
  const sortConfig = sortMap[sort] || { column: "created_at", ascending: false };

  // Build query
  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id, name), images:product_images(id, url, is_primary)",
      { count: "exact" }
    )
    .eq("store_id", store.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category) {
    query = query.eq("category_id", category);
  }
  if (visibility) {
    query = query.eq("visibility", visibility);
  }

  // "1" destacados, "0" no destacados. Cualquier otro valor se ignora.
  if (featured === "1" || featured === "0") {
    query = query.eq("is_featured", featured === "1");
  }

  const [
    { data: products, count: totalCount },
    { data: categories },
  ] = await Promise.all([
    query,
    supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", store.id)
      .order("name"),
  ]);

  const currency = store.store_settings?.[0]?.currency || "Gs";
  const isPro = store.plan === "pro";
  const MAX_FREE_PRODUCTS = 10;
  const atLimit =
    !isPro && (totalCount || 0) >= MAX_FREE_PRODUCTS;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  // Build query string helper
  const buildUrl = (newParams: Record<string, string>) => {
    const merged = { search: search || "", category: category || "", visibility: visibility || "", featured: featured || "", sort: sort || "", page: "1", ...newParams };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `/dashboard/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Productos"
        subtitle={`${totalCount || 0} productos${!isPro ? ` / ${MAX_FREE_PRODUCTS} en plan gratis` : ""}`}
      />

      {/* Filters & View Toggle */}
      <ProductFilters
        categories={categories || []}
        currentSearch={search || ""}
        currentCategory={category || ""}
        currentVisibility={visibility || ""}
        currentFeatured={featured || ""}
        currentSort={sort}
        products={(products as any[]) || []}
        currency={currency}
        atLimit={atLimit}
      />

      {/* Products table */}
      {!products || products.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl">
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            heading="Sin productos todavía"
            description="Agrega tu primer producto para empezar a construir tu catálogo"
            action={
              <Button asChild icon={<Plus className="w-4 h-4" />}>
                <Link href="/dashboard/products/new">
                  Agregar primer producto
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide pl-6 py-3 w-20">
                      Imagen
                    </th>
                    <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                      Producto
                    </th>
                    <th className="hidden lg:table-cell text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                      Categoría
                    </th>
                    <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                      Precio
                    </th>
                    <th className="hidden sm:table-cell text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                      Stock
                    </th>
                    <th className="hidden md:table-cell text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                      Visibilidad
                    </th>
                    <th className="w-px whitespace-nowrap text-right text-2xs font-medium text-neutral-400 uppercase tracking-wide pr-6 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {(products as Product[]).map((product) => {
                    const primaryImage = product.images?.find(
                      (img) => img.is_primary
                    );
                    const editHref = `/dashboard/products/${product.id}`;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50 transition-colors duration-100 group cursor-pointer">
                        {/* Imagen */}
                        <td className="pl-6 py-3 w-20">
                          <Link href={editHref} className="flex items-center h-full">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-neutral-300" />
                                </div>
                              )}
                              {/* Marca de destacado. Negra como el badge
                                  "Destacado" del storefront, no verde: el verde
                                  en esta misma fila ya significa "Visible". */}
                              {product.is_featured && (
                                <span
                                  title="Destacado"
                                  className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white ring-1 ring-white"
                                >
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                        {/* Producto */}
                        <td className="px-4 py-3">
                          <Link href={editHref} className="flex items-center h-full">
                            <span className="font-medium text-sm text-neutral-900 group-hover:text-brand-600 transition-colors">
                              {product.name}
                            </span>
                          </Link>
                        </td>
                        {/* Categoría */}
                        <td className="hidden lg:table-cell px-4 py-3">
                          <Link href={editHref} className="flex items-center h-full">
                            <span className="text-sm text-neutral-400">
                              {product.category?.name || "—"}
                            </span>
                          </Link>
                        </td>
                        {/* Precio */}
                        <td className="px-4 py-3">
                          <Link href={editHref} className="flex items-center h-full">
                            <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                              {product.show_price && product.price > 0
                                ? formatCurrency(product.price, currency)
                                : "—"}
                            </span>
                          </Link>
                        </td>
                        {/* Stock */}
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Link href={editHref} className="flex items-center h-full">
                            <span className="text-sm text-neutral-500">
                              {product.has_variants
                                ? "Variantes"
                                : product.track_inventory
                                  ? product.stock_quantity
                                  : product.stock_status === "available"
                                    ? "Disponible"
                                    : "Sin stock"}
                            </span>
                          </Link>
                        </td>
                        {/* Visibilidad */}
                        <td className="hidden md:table-cell px-4 py-3">
                          <VisibilityDropdown
                            productId={product.id}
                            currentVisibility={product.visibility}
                          />
                        </td>
                        {/* Acciones */}
                        <td className="w-px whitespace-nowrap pr-6 py-3">
                          <ProductsActions
                            productId={product.id}
                            productName={product.name}
                            productSlug={product.slug}
                            storeSlug={store.slug}
                            isFeatured={product.is_featured}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border border-neutral-200 rounded-[16px] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-neutral-500 gap-3">
              <span>
                Página {page} de {totalPages} ({totalCount} productos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
