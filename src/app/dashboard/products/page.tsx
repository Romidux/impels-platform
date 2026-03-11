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
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import ProductsActions from "@/components/dashboard/ProductsActions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; visibility?: string }>;
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

  // Build query
  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id, name), images:product_images(id, url, is_primary)"
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category) {
    query = query.eq("category_id", category);
  }
  if (visibility) {
    query = query.eq("visibility", visibility);
  }

  const { data: products } = await query;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", store.id)
    .order("name");

  const currency = store.store_settings?.[0]?.currency || "Gs";
  const isPro = store.plan === "pro";
  const MAX_FREE_PRODUCTS = 10;
  const atLimit =
    !isPro && (products?.length || 0) >= MAX_FREE_PRODUCTS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Productos
          </h1>
          <p className="text-gray-500 mt-1">
            {products?.length || 0} productos
            {!isPro && ` / ${MAX_FREE_PRODUCTS} en plan gratis`}
          </p>
        </div>
        {atLimit ? (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 bg-yellow-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-yellow-600 transition-colors text-sm"
          >
            ⚡ Upgrade para más productos
          </Link>
        ) : (
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 gradient-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card-flat p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            defaultValue={search}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
          />
        </div>
        <select
          defaultValue={category}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 transition-all bg-white"
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
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 transition-all bg-white"
        >
          <option value="">Visibilidad</option>
          <option value="visible">Visible</option>
          <option value="hidden">Oculto</option>
        </select>
      </div>

      {/* Products table */}
      {!products || products.length === 0 ? (
        <div className="card-flat p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Package className="w-9 h-9 text-gray-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
            Sin productos todavía
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Agrega tu primer producto para empezar a construir tu catálogo
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-3 rounded-xl hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar primer producto
          </Link>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Producto
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Categoría
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Precio
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Visibilidad
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
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
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">
                          {product.category?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {product.show_price
                            ? formatCurrency(product.price, currency)
                            : "Consultar"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            product.stock_status === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.stock_status === "available"
                            ? "Disponible"
                            : "Sin stock"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            product.visibility === "visible"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {product.visibility === "visible" ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {product.visibility === "visible" ? "Visible" : "Oculto"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ProductsActions productId={product.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
