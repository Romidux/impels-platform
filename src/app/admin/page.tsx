import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch platform stats in parallel
  const [
    { count: totalStores },
    { count: activeStores },
    { data: allStores },
    { count: totalOrders },
    { data: allOrders },
    { count: totalProducts },
  ] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("stores")
      .select("id, name, slug, plan, is_active, created_at, owner_id")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, status, created_at, store_id").neq("status", "cancelled"),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  // Calculate GMV
  const totalGMV = allOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  // New stores this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const newStoresThisMonth =
    allStores?.filter(
      (s) => new Date(s.created_at) >= thisMonth
    ).length || 0;

  // Plan distribution
  const freeStores = allStores?.filter((s) => s.plan === "free").length || 0;
  const proStores = allStores?.filter((s) => s.plan === "pro").length || 0;

  // Recent stores (last 5)
  const recentStores = allStores?.slice(0, 5) || [];

  // Stores with potential issues (inactive)
  const inactiveStores = allStores?.filter((s) => !s.is_active) || [];

  // Format currency
  const formatGMV = (value: number) => {
    if (value >= 1_000_000) return `₲ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₲ ${(value / 1_000).toFixed(0)}K`;
    return `₲ ${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Panel de Control"
        subtitle="Vista general de la plataforma Impels Commerce"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Store className="w-5 h-5 text-indigo-600" />}
          label="Total tiendas"
          value={totalStores || 0}
          trend={
            newStoresThisMonth > 0
              ? { value: `+${newStoresThisMonth} este mes`, positive: true }
              : undefined
          }
          href="/admin/stores"
        />
        <KpiCard
          icon={<ShoppingCart className="w-5 h-5 text-indigo-600" />}
          label="Pedidos totales"
          value={totalOrders || 0}
          href="/admin/stores"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          label="GMV total"
          value={formatGMV(totalGMV)}
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-indigo-600" />}
          label="Productos en plataforma"
          value={totalProducts || 0}
        />
      </div>

      {/* Plan Distribution + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plan distribution */}
        <Card
          header={{
            title: "Distribución de planes",
            icon: <Zap className="w-5 h-5 text-indigo-600" />,
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">F</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Plan Free</p>
                  <p className="text-xs text-slate-400">
                    {totalStores ? Math.round((freeStores / (totalStores || 1)) * 100) : 0}% del total
                  </p>
                </div>
              </div>
              <span className="font-display text-xl font-bold text-slate-900">
                {freeStores}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Plan Pro</p>
                  <p className="text-xs text-slate-400">
                    {totalStores ? Math.round((proStores / (totalStores || 1)) * 100) : 0}% del total
                  </p>
                </div>
              </div>
              <span className="font-display text-xl font-bold text-slate-900">
                {proStores}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width: `${totalStores ? Math.round((proStores / (totalStores || 1)) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Conversión a Pro: {totalStores ? Math.round((proStores / (totalStores || 1)) * 100) : 0}%
            </p>
          </div>
        </Card>

        {/* Alerts */}
        <Card
          padding={false}
          header={{
            title: "Alertas",
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          }}
        >
          <div className="divide-y divide-gray-50">
            {inactiveStores.length > 0 ? (
              <Link
                href="/admin/stores?status=inactive"
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm text-slate-700 flex-1">
                  {inactiveStores.length} tienda{inactiveStores.length > 1 ? "s" : ""} inactiva{inactiveStores.length > 1 ? "s" : ""}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ) : (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Todo en orden
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sin alertas activas
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Active stores stat */}
        <Card
          header={{
            title: "Estado de tiendas",
            icon: <Users className="w-5 h-5 text-indigo-600" />,
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>Activas</Badge>
              </div>
              <span className="font-display font-bold text-lg text-slate-900">
                {activeStores || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Badge variant="error" dot>Inactivas</Badge>
              </div>
              <span className="font-display font-bold text-lg text-slate-900">
                {(totalStores || 0) - (activeStores || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Stores */}
      <Card
        padding={false}
        header={{
          title: "Tiendas recientes",
          icon: <Store className="w-5 h-5 text-indigo-600" />,
          action: (
            <Link
              href="/admin/stores"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ),
        }}
      >
        {recentStores.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-400">Sin tiendas registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentStores.map((s) => (
              <Link
                key={s.id}
                href={`/admin/stores/${s.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-600">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString("es-PY")}
                    <span className="mx-1">·</span>
                    {s.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={s.plan === "pro" ? "brand" : "neutral"}
                    size="sm"
                  >
                    {s.plan === "pro" ? "Pro" : "Free"}
                  </Badge>
                  <Badge
                    variant={s.is_active ? "success" : "error"}
                    dot
                    size="sm"
                  >
                    {s.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
