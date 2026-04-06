import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Plus,
  Package,
  Search,
  Eye,
  EyeOff,
  Edit,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Product } from "@/lib/types";
import ProductsActions from "@/components/dashboard/ProductsActions";
import { PageHeader } from "@/components/ui/PageHeader";
import ProductFilters from "@/components/dashboard/ProductFilters";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; visibility?: string; page?: string; view?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, plan, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const params = await searchParams;
  const { search, category, visibility } = params;
  const view = params.view || "list";
  const page = parseInt(params.page || "1");
  const pageSize = view === "grid" ? 16 : 15;

  // Build query
  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id, name), images:product_images(id, url, is_primary)",
      { count: "exact" }
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
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

  const { data: products, count: totalCount } = await query;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", store.id)
    .order("name");

  const currency = store.store_settings?.[0]?.currency || "Gs";
  const isPro = store.plan === "pro";
  const MAX_FREE_PRODUCTS = 10;
  const atLimit =
    !isPro && (totalCount || 0) >= MAX_FREE_PRODUCTS;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  // Build query string helper
  const buildUrl = (newParams: Record<string, string>) => {
    const merged = { search: search || "", category: category || "", visibility: visibility || "", view, page: "1", ...newParams };
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
        actions={
          atLimit ? (
            <Link href="/dashboard/plan">
              <Button variant="secondary" icon={<Package className="w-4 h-4" />}>
                ⚡ Upgrade para más
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/products/new">
              <Button icon={<Plus className="w-4 h-4" />}>
                Nuevo producto
              </Button>
            </Link>
          )
        }
      />

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ProductFilters
          categories={categories || []}
          currentSearch={search || ""}
          currentCategory={category || ""}
          currentVisibility={visibility || ""}
          currentView={view || "list"}
        />

        {/* View mode toggle */}
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shrink-0 h-11 self-end sm:self-auto">
          <Link
            href={buildUrl({ view: "list", page: "1" })}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
              view === "list"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-700"
            )}
            title="Vista de lista"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </Link>
          <Link
            href={buildUrl({ view: "grid", page: "1" })}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
              view === "grid"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-700"
            )}
            title="Vista de cuadrícula"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </Link>
        </div>
      </div>

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
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 rounded-tl-xl">
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
                  <tbody className="divide-y divide-gray-50">
                    {(products as Product[]).map((product) => {
                      const primaryImage = product.images?.find(
                        (img) => img.is_primary
                      );
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                {primaryImage ? (
                                  <img
                                    src={primaryImage.url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-slate-900 group-hover:text-green-700 transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  /{product.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-slate-500">
                              {product.category?.name || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {product.show_price
                                ? formatCurrency(product.price, currency)
                                : "Consultar"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                product.stock_status === "available"
                                  ? "success"
                                  : "error"
                              }
                              dot
                            >
                              {product.has_variants
                                ? "Variantes"
                                : product.track_inventory
                                  ? `${product.stock_quantity} unids.`
                                  : product.stock_status === "available"
                                    ? "Disponible"
                                    : "Sin stock"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                product.visibility === "visible"
                                  ? "info"
                                  : "neutral"
                              }
                            >
                              {product.visibility === "visible" ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                              {product.visibility === "visible" ? "Visible" : "Oculto"}
                            </Badge>
                          </td>
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
