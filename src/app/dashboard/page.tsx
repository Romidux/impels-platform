import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  Eye,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/lib/types";
import { getStoreUrl } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmado", color: "bg-indigo-100 text-indigo-700" },
  processing: { label: "En proceso", color: "bg-yellow-100 text-yellow-700" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", user.id)
    .single();

  if (!store) redirect("/onboarding");

  // Fetch stats in parallel
  const [
    { count: totalProducts },
    { count: totalOrders },
    { data: recentOrders },
    { data: orders },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select("total, status")
      .eq("store_id", store.id)
      .neq("status", "cancelled"),
  ]);

  const totalRevenue =
    orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const newOrders = orders?.filter((o) => o.status === "new").length || 0;
  const currency = store.store_settings?.[0]?.currency || "Gs";

  const stats = [
    {
      label: "Productos",
      value: totalProducts || 0,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      href: "/dashboard/products",
      hint: "Ver todos",
    },
    {
      label: "Pedidos totales",
      value: totalOrders || 0,
      icon: ShoppingCart,
      color: "from-purple-500 to-purple-600",
      href: "/dashboard/orders",
      hint: `${newOrders} nuevos`,
    },
    {
      label: "Ingresos totales",
      value: formatCurrency(totalRevenue, currency),
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      href: "/dashboard/orders",
      hint: "Total histórico",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido a <span className="font-semibold">{store.name}</span>
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="font-display text-3xl font-black text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.hint}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card-flat p-6">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Agregar producto",
              href: "/dashboard/products/new",
              icon: Package,
              color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
            },
            {
              label: "Ver pedidos",
              href: "/dashboard/orders",
              icon: ShoppingCart,
              color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
            },
            {
              label: "Ver mi tienda",
              href: `/store/${store.slug}`,
              icon: Eye,
              color: "bg-green-50 text-green-600 hover:bg-green-100",
            },
            {
              label: "Apariencia",
              href: "/dashboard/appearance",
              icon: TrendingUp,
              color: "bg-pink-50 text-pink-600 hover:bg-pink-100",
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${action.color} transition-colors text-center`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-flat">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-gray-900">
            Pedidos recientes
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {!recentOrders || recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">Sin pedidos todavía</p>
            <p className="text-gray-300 text-sm mt-1">
              Comparte el link de tu tienda para empezar a recibir pedidos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(recentOrders as Order[]).map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.new;
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString("es-PY")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">
                      {formatCurrency(order.total, currency)}
                    </p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
