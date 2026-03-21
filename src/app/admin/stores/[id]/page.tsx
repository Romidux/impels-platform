import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  DollarSign,
  Package,
  ShoppingCart,
  ExternalLink,
  Clock,
  User,
  Activity,
  Settings,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToggleStoreButton } from "./ToggleStoreButton";
import { ImpersonateButton } from "./ImpersonateButton";
import { getStoreUrl } from "@/lib/utils";

export default async function AdminStoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch store + owner info
  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*), auth_users:owner_id(email)")
    .eq("id", id)
    .single();

  if (!store) notFound();

  // Fetch store stats in parallel
  const [
    { count: productCount },
    { count: orderCount },
    { data: orders },
    { count: categoryCount },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", id),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", id),
    supabase
      .from("orders")
      .select("total, status, created_at, customer_name")
      .eq("store_id", id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("store_id", id),
  ]);

  const revenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const settings = store?.store_settings?.[0];
  const storeUrl = getStoreUrl(store.slug);
  const ownerEmail = store.auth_users?.email || "Email no disponible";

  // Health score calculation
  const hasProducts = (productCount || 0) > 0;
  const hasWhatsApp = !!settings?.whatsapp_number;
  const hasTemplate = !!settings?.template;
  const hasOrders = (orderCount || 0) > 0;
  const healthItems = [hasProducts, hasWhatsApp, hasTemplate, hasOrders];
  const healthScore = Math.round(
    (healthItems.filter(Boolean).length / healthItems.length) * 100
  );

  const formatCurrency = (value: number) => {
    const currency = settings?.currency || "Gs";
    return `${currency} ${value.toLocaleString("es-PY")}`;
  };

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tiendas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-slate-600">
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {store.name}
                </h1>
                <Badge variant={store.is_active ? "success" : "error"} dot>
                  {store.is_active ? "Activa" : "Suspendida"}
                </Badge>
                <Badge variant={store.plan === "pro" ? "brand" : "neutral"}>
                  {store.plan === "pro" ? "Pro ✨" : "Free"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-slate-700 font-medium">{ownerEmail}</span>
                <span className="hidden sm:inline">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Creada {new Date(store.created_at).toLocaleDateString("es-PY")}
                </span>
                <span className="hidden sm:inline">·</span>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  {store.slug}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ImpersonateButton 
              storeId={store.id} 
              storeName={store.name} 
              ownerEmail={ownerEmail} 
            />
            <ToggleStoreButton storeId={store.id} isActive={store.is_active} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Configuraciones
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="w-4 h-4" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<Package className="w-5 h-5 text-indigo-600" />}
              label="Productos"
              value={productCount || 0}
            />
            <KpiCard
              icon={<ShoppingCart className="w-5 h-5 text-indigo-600" />}
              label="Pedidos"
              value={orderCount || 0}
            />
            <KpiCard
              icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
              label="Revenue"
              value={formatCurrency(revenue)}
            />
            <KpiCard
              icon={<User className="w-5 h-5 text-indigo-600" />}
              label="Health Score"
              value={`${healthScore}%`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Configuration status */}
            <Card header={{ title: "Estado de configuración y Onboarding" }}>
              <div className="space-y-3">
                {[
                  { label: "Productos cargados", done: hasProducts, count: productCount },
                  { label: "WhatsApp configurado", done: hasWhatsApp, value: settings?.whatsapp_number },
                  { label: "Template seleccionado", done: hasTemplate, value: settings?.template },
                  { label: "Categorías creadas", done: (categoryCount || 0) > 0, count: categoryCount },
                  { label: "Ha recibido pedidos", done: hasOrders, count: orderCount },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.done
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {item.done ? "✓" : "—"}
                      </div>
                      <span className="text-sm text-slate-700 font-medium">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {item.value || (item.count !== undefined ? item.count : "")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Health progress bar */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Completitud de setup
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {healthScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      healthScore >= 75
                        ? "bg-green-500"
                        : healthScore >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Recent Merchant Activity */}
            <Card padding={false} header={{ title: "Actividad reciente de ventas" }}>
              {recentOrders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-6 h-6" />}
                  heading="Sin actividad detectada"
                  description="Esta tienda aún no ha procesado ningún pedido orgánico."
                />
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentOrders.map((order: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{order.customer_name || "Cliente anónimo"}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleString("es-PY")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
                        <Badge variant="info" size="sm">Completado</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <EmptyState
              icon={<Settings className="w-8 h-8 text-slate-400" />}
              heading="Configuraciones en read-only"
              description="Las configuraciones a nivel de plataforma y métodos de pago de esta tienda se mostrarán aquí (En desarrollo)."
            />
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <EmptyState
              icon={<ScrollText className="w-8 h-8 text-slate-400" />}
              heading="Audit Logs de la Tienda"
              description="Historial de inicios de sesión, cambios de plan, y acciones de super-admin sobre esta tienda (En desarrollo)."
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
