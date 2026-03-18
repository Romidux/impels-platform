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
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import ProductsActions from "@/components/dashboard/ProductsActions";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashBadge } from "@/components/dashboard/ui/DashBadge";
import { DashEmptyState } from "@/components/dashboard/ui/DashEmptyState";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; visibility?: string; page?: string }>;
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
  const page = parseInt(params.page || "1");
  const pageSize = 15;

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
    const merged = { search: search || "", category: category || "", visibility: visibility || "", page: "1", ...newParams };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `/dashboard/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Productos"
        subtitle={`${totalCount || 0} productos${!isPro ? ` / ${MAX_FREE_PRODUCTS} en plan gratis` : ""}`}
      >
        {atLimit ? (
          <Link href="/dashboard/plan">
            <DashButton variant="secondary">
              <Package className="w-4 h-4" />
              ⚡ Upgrade para más
            </DashButton>
          </Link>
        ) : (
          <Link href="/dashboard/products/new">
            <DashButton>
              <Plus className="w-4 h-4" />
              Nuevo producto
            </DashButton>
          </Link>
        )}
      </DashPageHeader>

      {/* Filters */}
      <div className="dash-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            defaultValue={search}
            placeholder="Buscar productos..."
            className="dash-input pl-9"
          />
        </div>
        <select
          defaultValue={category}
          className="dash-input bg-white w-auto min-w-[180px]"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          defaultValue={visibility}
          className="dash-input bg-white w-auto min-w-[140px]"
        >
          <option value="">Visibilidad</option>
          <option value="visible">Visible</option>
          <option value="hidden">Oculto</option>
        </select>
      </div>

      {/* Products table */}
      {!products || products.length === 0 ? (
        <div className="dash-card">
          <DashEmptyState
            icon={<Package className="w-7 h-7 text-green-600" />}
            title="Sin productos todavía"
            description="Agrega tu primer producto para empezar a construir tu catálogo"
            action={{
              label: "Agregar primer producto",
              href: "/dashboard/products/new",
              icon: <Plus className="w-4 h-4" />,
            }}
          />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Producto
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Categoría
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Precio
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Stock
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                    Visibilidad
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
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
                        <DashBadge
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
                        </DashBadge>
                      </td>
                      <td className="px-4 py-3.5">
                        <DashBadge
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
                        </DashBadge>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-slate-500">
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
