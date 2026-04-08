import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import Link from "next/link";
import {
  Plus,
  Package,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import ProductsActions from "@/components/dashboard/ProductsActions";
import VisibilityDropdown from "@/components/dashboard/VisibilityDropdown";
import { PageHeader } from "@/components/ui/PageHeader";
import ProductFilters from "@/components/dashboard/ProductFilters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; visibility?: string; page?: string; view?: string; sort?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const store = await getStore(user.id);
  if (!store) redirect("/onboarding");

  const supabase = await createClient();

  const params = await searchParams;
  const { search, category, visibility } = params;
  const view = params.view || "list";
  const sort = params.sort || "";
  const page = parseInt(params.page || "1");
  const pageSize = view === "grid" ? 16 : 15;

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
    const merged = { search: search || "", category: category || "", visibility: visibility || "", sort: sort || "", view, page: "1", ...newParams };
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
        currentView={view || "list"}
        currentSort={sort}
        products={(products as any[]) || []}
        currency={currency}
        atLimit={atLimit}
      />

      {/* Products table */}
      {!products || products.length === 0 ? (
        <div className="dash-card">
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
          {view === "list" ? (
            <div className="dash-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F2F4F6]">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 rounded-tl-xl w-14">
                        Imagen
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                        Producto
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                        Categoría
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                        Precio
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                        Stock
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                        Visibilidad
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3 rounded-tr-xl">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(products as Product[]).map((product) => {
                      const primaryImage = product.images?.find(
                        (img) => img.is_primary
                      );
                      const editHref = `/dashboard/products/${product.id}`;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group cursor-pointer">
                          {/* Imagen */}
                          <td className="px-0 py-0 w-14">
                            <Link href={editHref} className="flex items-center justify-center px-5 py-2.5 h-full">
                              <div className="w-11 h-11 rounded overflow-hidden bg-slate-50 flex-shrink-0">
                                {primaryImage ? (
                                  <img
                                    src={primaryImage.url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                  </div>
                                )}
                              </div>
                            </Link>
                          </td>
                          {/* Producto */}
                          <td className="px-0 py-0">
                            <Link href={editHref} className="flex items-center px-4 py-3.5 h-full">
                              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {product.name}
                              </span>
                            </Link>
                          </td>
                          {/* Categoría */}
                          <td className="px-0 py-0">
                            <Link href={editHref} className="flex items-center px-4 py-3.5 h-full">
                              <span className="text-sm text-slate-500">
                                {product.category?.name || "—"}
                              </span>
                            </Link>
                          </td>
                          {/* Precio */}
                          <td className="px-0 py-0">
                            <Link href={editHref} className="flex items-center px-4 py-3.5 h-full">
                              <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                {product.show_price && product.price > 0
                                  ? formatCurrency(product.price, currency)
                                  : "—"}
                              </span>
                            </Link>
                          </td>
                          {/* Stock */}
                          <td className="px-0 py-0">
                            <Link href={editHref} className="flex items-center px-4 py-3.5 h-full">
                              <span className={
                                product.has_variants
                                  ? "text-sm text-slate-500"
                                  : product.stock_status === "available"
                                    ? "text-sm text-slate-700"
                                    : "text-sm text-slate-400"
                              }>
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
                          <td className="px-4 py-3.5">
                            <VisibilityDropdown
                              productId={product.id}
                              currentVisibility={product.visibility}
                            />
                          </td>
                          {/* Acciones */}
                          <td className="px-5 py-3.5">
                            <ProductsActions productId={product.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(products as Product[]).map((product) => {
                const primaryImage = product.images?.find((img) => img.is_primary);
                return (
                  <div key={product.id} className="dash-card flex flex-col group overflow-hidden p-0 border border-slate-200">
                    <div className="relative aspect-square bg-slate-100 border-b border-slate-100">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <Badge variant={product.visibility === "visible" ? "info" : "neutral"} className="shadow-sm backdrop-blur-md bg-white/90">
                          {product.visibility === "visible" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-xs text-slate-500 mb-1">{product.category?.name || "Sin categoría"}</p>
                      <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-brand-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {product.show_price ? formatCurrency(product.price, currency) : "Consultar"}
                        </span>
                        <ProductsActions productId={product.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dash-card px-5 py-3 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-3">
              <span>
                Página {page} de {totalPages} ({totalCount} productos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
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
