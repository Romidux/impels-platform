import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreUrl } from "@/lib/utils";
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
import { Card } from "@/components/ui/Card";

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
          iconClassName="bg-brand-50"
          trend={monthlyRevenue > 0 ? { value: `${monthlyOrderCount} pedidos este mes`, positive: true } : undefined}
        />
        <KpiCard
          icon={<ShoppingCart className="w-5 h-5 text-violet-600" />}
          label="Pedidos del mes"
          value={monthlyOrderCount}
          iconClassName="bg-violet-50"
          trend={(todayOrdersCount || 0) > 0 ? { value: `${todayOrdersCount} pedidos hoy`, positive: true } : undefined}
        />
        <KpiCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          label="Pedidos pendientes"
          value={newOrdersCount || 0}
          iconClassName="bg-amber-50"
          trend={(newOrdersCount || 0) > 0 ? { value: "Requieren atención", positive: false } : { value: "Todo al día ✓", positive: true }}
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          label="Productos activos"
          value={productsCount || 0}
          iconClassName="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table */}
        <Card
          className="lg:col-span-2 overflow-hidden"
          padding={false}
          header={{
            title: "Últimos pedidos",
            icon: <ShoppingCart className="w-4 h-4 text-brand-600" />,
            action: (
              <Link
                href="/dashboard/orders"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Ver todos
              </Link>
            ),
          }}
        >
          {!recentOrders || recentOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="w-6 h-6" />}
              heading="Aún no hay pedidos"
              description="Comparte el link de tu tienda en tus redes sociales para recibir tu primer pedido."
              action={
                <CopyLinkButton
                  url={getStoreUrl(store.slug)}
                  className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors shadow-sm"
                />
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F2F4F6]">
                    <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Cliente</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Fecha</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Estado</th>
                    <th className="text-right text-xs font-semibold text-slate-500 py-3 px-5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer group">
                      <td className="py-3.5 px-5">
                        <Link href={`/dashboard/orders?status=${order.status}`} className="block">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                            {order.customer_name || "Cliente"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {order.customer_phone || ""}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString("es-PY")}
                      </td>
                      <td className="py-3.5 px-5">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-slate-900 text-right">
                        {formatCurrency(order.total || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="space-y-5">
          {/* Main CTA */}
          <Card className="bg-brand-50 border-brand-100" padding={false}>
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3">
                <Store className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-brand-900 mb-1">Tu tienda online</h3>
              <p className="text-sm text-brand-700/80 mb-4">
                Comparte este link con tus clientes para que puedan comprar.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={getStoreUrl(store.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Abrir tienda
                </a>
                <CopyLinkButton
                  url={getStoreUrl(store.slug)}
                  className="w-full text-center px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                />
              </div>
            </div>
          </Card>

          {/* Settings Shortcuts */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Ajustes rápidos
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              <Link
                href="/dashboard/store/appearance"
                className="flex items-center justify-between p-4 hover:bg-slate-50 group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700 transition-colors">Diseño</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
              </Link>
              <Link
                href="/dashboard/store/identity"
                className="flex items-center justify-between p-4 hover:bg-slate-50 group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-700 transition-colors">General</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

