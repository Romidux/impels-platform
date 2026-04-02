import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Tag,
  Eye,
  Settings,
  Store,
  ArrowRight,
  Paintbrush,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MerchantAnnouncements } from "@/components/dashboard/MerchantAnnouncements";
import { CopyLinkButton } from "@/components/dashboard/ui/CopyLinkButton";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { OrderStatus } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's store
  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", user.id)
    .single();

  if (!store) {
    redirect("/onboarding");
  }

  // Calculate date ranges for real metrics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Fetch real metrics for the store in parallel
  const [
    { count: productsCount },
    { data: recentOrders },
    { data: monthlyOrders },
    { count: todayOrdersCount },
    { count: newOrdersCount },
  ] = await Promise.all([
    supabase
      .from("products")
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
      .select("total")
      .eq("store_id", store.id)
      .gte("created_at", startOfMonth),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .gte("created_at", startOfToday),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("status", "new"),
  ]);

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;

  // Real revenue calculation from current month
  const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const monthlyOrderCount = monthlyOrders?.length || 0;

  const formatCurrency = (value: number) => {
    const currency = settings?.currency || "Gs";
    return `${value.toLocaleString("es-PY")} ${currency}`;
  };

  // Setup completeness
  const hasProducts = (productsCount || 0) > 0;
  const hasWhatsApp = !!settings?.whatsapp_number;
  const hasTemplate = !!settings?.template;
  const isOnboardingComplete = hasProducts && hasWhatsApp && hasTemplate;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Hola, ${store.name}`}
        subtitle="Aquí está el resumen de tu tienda hoy."
      />

      <MerchantAnnouncements />

      {/* Conditionally render SetupWizard if store is incomplete */}
      {!isOnboardingComplete && (
        <SetupWizard 
          hasProducts={hasProducts} 
          hasWhatsApp={hasWhatsApp} 
          hasTemplate={hasTemplate} 
        />
      )}

      {/* Main KPI Cards — REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
          label="Ventas del mes"
          value={formatCurrency(monthlyRevenue)}
          trend={monthlyRevenue > 0 ? { value: `${monthlyOrderCount} pedidos este mes`, positive: true } : undefined}
        />
        <KpiCard
          icon={<ShoppingCart className="w-5 h-5 text-brand-600" />}
          label="Pedidos del mes"
          value={monthlyOrderCount}
          trend={(todayOrdersCount || 0) > 0 ? { value: `${todayOrdersCount} pedidos hoy`, positive: true } : undefined}
        />
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          label="Pedidos pendientes"
          value={newOrdersCount || 0}
          trend={(newOrdersCount || 0) > 0 ? { value: "Requieren atención", positive: false } : { value: "Todo al día ✓", positive: true }}
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-brand-600" />}
          label="Productos activos"
          value={productsCount || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              Últimos pedidos
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver todos
            </Link>
          </div>
          
          <div className="p-0">
            {!recentOrders || recentOrders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="w-6 h-6" />}
                heading="Aún no hay pedidos"
                description="Comparte el link de tu tienda en tus redes sociales para recibir tu primer pedido."
                action={
                  <CopyLinkButton 
                    url={`https://${store.slug}.impels.com`}
                    className="h-10 px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-brand-600/20"
                  />
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50/50">
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Cliente</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Fecha</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Estado</th>
                      <th className="text-right text-xs font-semibold text-slate-500 py-3 px-5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <td className="py-3 px-5">
                          <Link href={`/dashboard/orders?status=${order.status}`} className="block">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                              {order.customer_name || "Cliente"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.customer_phone || ""}
                            </p>
                          </Link>
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-600">
                          {new Date(order.created_at).toLocaleDateString("es-PY")}
                        </td>
                        <td className="py-3 px-5">
                          <OrderStatusBadge status={order.status as OrderStatus} />
                        </td>
                        <td className="py-3 px-5 text-sm font-semibold text-slate-900 text-right">
                          {formatCurrency(order.total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-5">
          {/* Main CTA */}
          <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center mb-3">
              <Store className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-semibold text-brand-900 mb-1">Tu tienda online</h3>
            <p className="text-sm text-brand-700 mb-4">
              Comparte este link con tus clientes para que puedan comprar.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={getStoreUrl(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all duration-200 shadow-lg shadow-brand-600/25"
              >
                Abrir tienda
              </a>
              <CopyLinkButton
                url={getStoreUrl(store.slug)}
                className="w-full text-center px-4 py-2 bg-white text-brand-700 border border-brand-200 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors"
              />
            </div>
          </div>

          {/* Settings Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ajustes rápidos
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              <Link 
                href="/dashboard/store/theme" 
                className="flex items-center justify-between p-4 hover:bg-slate-50 group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700">Diseño</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400" />
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center justify-between p-4 hover:bg-slate-50 group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700">General</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add a helper to replace hardcoded strings
// In a real app this might come from a utils file
function getStoreUrl(slug: string) {
  if (process.env.NODE_ENV === "development") {
    return `http://${slug}.localhost:3000`;
  }
  return `https://${slug}.impels.com`;
}
