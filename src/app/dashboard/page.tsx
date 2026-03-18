import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Palette,
  Phone,
  Layers,
  Store,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/lib/types";
import { DashKpiCard } from "@/components/dashboard/ui/DashKpiCard";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashBadge } from "@/components/dashboard/ui/DashBadge";

const STATUS_MAP: Record<string, { label: string; variant: "info" | "warning" | "success" | "error" | "neutral" }> = {
  new: { label: "Nuevo", variant: "info" },
  confirmed: { label: "Confirmado", variant: "info" },
  processing: { label: "En proceso", variant: "warning" },
  delivered: { label: "Entregado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "error" },
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
    { data: allOrders },
    { data: lowStockProducts },
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
    supabase
      .from("products")
      .select("id, name, stock_quantity, stock_status, track_inventory")
      .eq("store_id", store.id)
      .eq("track_inventory", true)
      .lte("stock_quantity", 5)
      .limit(5),
  ]);

  const totalRevenue =
    allOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const newOrders = allOrders?.filter((o) => o.status === "new").length || 0;
  const pendingOrders =
    allOrders?.filter((o) => o.status === "processing").length || 0;
  const currency = store.store_settings?.[0]?.currency || "Gs";

  // Onboarding checklist
  const hasProducts = (totalProducts || 0) > 0;
  const hasWhatsApp = !!store.store_settings?.[0]?.whatsapp_number;
  const hasTemplate = !!store.store_settings?.[0]?.template;
  const hasOrders = (totalOrders || 0) > 0;
  const onboardingComplete = hasProducts && hasWhatsApp && hasTemplate;

  // Alerts
  const alerts: { message: string; type: "warning" | "info"; href: string }[] = [];
  if (newOrders > 0) {
    alerts.push({
      message: `${newOrders} pedido${newOrders > 1 ? "s" : ""} nuevo${newOrders > 1 ? "s" : ""} sin confirmar`,
      type: "warning",
      href: "/dashboard/orders?status=new",
    });
  }
  if (pendingOrders > 0) {
    alerts.push({
      message: `${pendingOrders} pedido${pendingOrders > 1 ? "s" : ""} en proceso`,
      type: "info",
      href: "/dashboard/orders?status=processing",
    });
  }
  if (lowStockProducts && lowStockProducts.length > 0) {
    alerts.push({
      message: `${lowStockProducts.length} producto${lowStockProducts.length > 1 ? "s" : ""} con stock bajo`,
      type: "warning",
      href: "/dashboard/inventory",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashPageHeader
        title={`Hola, bienvenido 👋`}
        subtitle={`Panel de ${store.name}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashKpiCard
          icon={<DollarSign className="w-5 h-5 text-green-700" />}
          label="Ingresos totales"
          value={formatCurrency(totalRevenue, currency)}
          href="/dashboard/orders"
        />
        <DashKpiCard
          icon={<ShoppingCart className="w-5 h-5 text-green-700" />}
          label="Pedidos totales"
          value={totalOrders || 0}
          trend={newOrders > 0 ? { value: `${newOrders} nuevos`, positive: true } : undefined}
          href="/dashboard/orders"
        />
        <DashKpiCard
          icon={<Package className="w-5 h-5 text-green-700" />}
          label="Productos"
          value={totalProducts || 0}
          href="/dashboard/products"
        />
        <DashKpiCard
          icon={<TrendingUp className="w-5 h-5 text-green-700" />}
          label="Tasa de completado"
          value={
            (totalOrders || 0) > 0
              ? `${Math.round(((allOrders?.filter((o) => o.status === "delivered").length || 0) / (totalOrders || 1)) * 100)}%`
              : "—"
          }
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <DashCard padding={false}>
          <div className="divide-y divide-gray-100">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                href={alert.href}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === "warning"
                      ? "bg-amber-50"
                      : "bg-blue-50"
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      alert.type === "warning"
                        ? "text-amber-600"
                        : "text-blue-500"
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-700 flex-1">
                  {alert.message}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </DashCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <DashCard
            padding={false}
            header={{
              title: "Pedidos recientes",
              icon: <ShoppingCart className="w-5 h-5 text-green-600" />,
              action: (
                <Link
                  href="/dashboard/orders"
                  className="text-xs text-green-700 hover:text-green-600 font-semibold flex items-center gap-1"
                >
                  Ver todos
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ),
            }}
          >
            {!recentOrders || recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Sin pedidos todavía
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Comparte el link de tu tienda para empezar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(recentOrders as Order[]).map((order) => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString(
                            "es-PY"
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-slate-900">
                          {formatCurrency(order.total, currency)}
                        </p>
                        <DashBadge variant={status.variant}>
                          {status.label}
                        </DashBadge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashCard>
        </div>

        {/* Quick Actions + Onboarding */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <DashCard header={{ title: "Acciones rápidas", icon: <Layers className="w-5 h-5 text-green-600" /> }}>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/products/new"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-center"
              >
                <Package className="w-5 h-5" />
                <span className="text-xs font-semibold">Agregar producto</span>
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-center"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-semibold">Ver pedidos</span>
              </Link>
              <Link
                href={`/store/${store.slug}`}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-center"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs font-semibold">Ver tienda</span>
              </Link>
              <Link
                href="/dashboard/store/theme"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-center"
              >
                <Palette className="w-5 h-5" />
                <span className="text-xs font-semibold">Editar tema</span>
              </Link>
            </div>
          </DashCard>

          {/* Onboarding Checklist */}
          {!onboardingComplete && (
            <DashCard
              header={{
                title: "Configura tu tienda",
                icon: <Store className="w-5 h-5 text-amber-500" />,
              }}
            >
              <div className="space-y-2">
                <Link
                  href="/dashboard/products/new"
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    hasProducts ? "bg-green-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  {hasProducts ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${hasProducts ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                    Agregar tu primer producto
                  </span>
                  {!hasProducts && <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
                </Link>

                <Link
                  href="/dashboard/settings"
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    hasWhatsApp ? "bg-green-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  {hasWhatsApp ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${hasWhatsApp ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                    Configurar WhatsApp
                  </span>
                  {!hasWhatsApp && <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
                </Link>

                <Link
                  href="/dashboard/store/theme"
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    hasTemplate ? "bg-green-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  {hasTemplate ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${hasTemplate ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                    Elegir un template
                  </span>
                  {!hasTemplate && <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
                </Link>

                <Link
                  href="/dashboard/orders"
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                    hasOrders ? "bg-green-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  {hasOrders ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${hasOrders ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                    Recibir tu primer pedido
                  </span>
                  {!hasOrders && <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
                </Link>
              </div>
            </DashCard>
          )}
        </div>
      </div>
    </div>
  );
}
