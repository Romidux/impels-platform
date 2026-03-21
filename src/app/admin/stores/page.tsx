import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Store,
  Search,
  ArrowRight,
  Clock,
  Package,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all stores with related counts
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, plan, is_active, created_at, owner_id")
    .order("created_at", { ascending: false });

  // Fetch product counts and order counts for each store
  const storeIds = stores?.map((s) => s.id) || [];

  let productCounts: Record<string, number> = {};
  let orderCounts: Record<string, number> = {};

  if (storeIds.length > 0) {
    // Get product counts per store
    const { data: products } = await supabase
      .from("products")
      .select("store_id")
      .in("store_id", storeIds);

    if (products) {
      productCounts = products.reduce(
        (acc, p) => {
          acc[p.store_id] = (acc[p.store_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Get order counts per store
    const { data: orders } = await supabase
      .from("orders")
      .select("store_id")
      .in("store_id", storeIds);

    if (orders) {
      orderCounts = orders.reduce(
        (acc, o) => {
          acc[o.store_id] = (acc[o.store_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestión de Tiendas"
        subtitle={`${stores?.length || 0} tiendas registradas en la plataforma`}
      />

      {/* Table */}
      <div className="dash-card overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o slug..."
              className="dash-input pl-10"
              disabled
            />
          </div>
        </div>

        {/* Table */}
        {!stores || stores.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Store className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              No hay tiendas registradas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Tienda
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Plan
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Productos
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Pedidos
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Creada
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-slate-600">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={s.plan === "pro" ? "brand" : "neutral"}
                        size="sm"
                      >
                        {s.plan === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={s.is_active ? "success" : "error"}
                        dot
                        size="sm"
                      >
                        {s.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        {productCounts[s.id] || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                        {orderCounts[s.id] || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(s.created_at).toLocaleDateString("es-PY", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/stores/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Ver detalle
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
