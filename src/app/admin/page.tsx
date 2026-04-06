import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Store,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  ShieldX,
  Store as StoreIcon,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

// ── Types returned by the get_admin_overview() RPC ──────────────────────────

type AdminOverviewStats = {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  new_stores_this_month: number;
  stores_without_orders: number;
  stores_without_recent_activity: number;
  platform_total_orders: number;
  platform_total_revenue: number;
};

type RecentNewStore = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  total_orders: number;
};

type StoreToReview = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  last_order_at: string | null;
  has_orders: boolean;
};

type AdminOverviewData = {
  stats: AdminOverviewStats;
  recent_new_stores: RecentNewStore[];
  stores_to_review: StoreToReview[];
};

type OverviewAlert = {
  title: string;
  description: string;
  href: string;
  variant: "error" | "warning" | "info";
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  // Single RPC replaces two full-table fetches + JS Map aggregation.
  // See supabase/migrations/015_admin_overview_rpc.sql
  const { data: overviewRaw, error } = await adminClient.rpc("get_admin_overview");

  if (error) {
    throw new Error(`get_admin_overview RPC failed: ${error.message}`);
  }

  const {
    stats,
    recent_new_stores: recentNewStores,
    stores_to_review: storesToReview,
  } = overviewRaw as AdminOverviewData;

  // ── Alerts ────────────────────────────────────────────────────────────────

  const alerts = [
    stats.inactive_stores > 0
      ? {
          title: `${stats.inactive_stores} tienda${
            stats.inactive_stores === 1 ? "" : "s"
          } inactiva${stats.inactive_stores === 1 ? "" : "s"}`,
          description: "Revisa si deben reactivarse o mantenerse suspendidas.",
          href: "/admin/stores?status=inactive",
          variant: "error" as const,
        }
      : null,
    stats.stores_without_orders > 0
      ? {
          title: `${stats.stores_without_orders} tienda${
            stats.stores_without_orders === 1 ? "" : "s"
          } sin pedidos`,
          description: "Detecta onboarding incompleto o falta de activacion.",
          href: "/admin/stores?activity=no-orders",
          variant: "warning" as const,
        }
      : null,
    stats.stores_without_recent_activity > 0
      ? {
          title: `${stats.stores_without_recent_activity} tienda${
            stats.stores_without_recent_activity === 1 ? "" : "s"
          } sin actividad reciente`,
          description: "No registran pedidos en los ultimos 30 dias.",
          href: "/admin/stores?activity=no-recent",
          variant: "warning" as const,
        }
      : null,
    stats.new_stores_this_month > 0
      ? {
          title: `${stats.new_stores_this_month} tienda${
            stats.new_stores_this_month === 1 ? "" : "s"
          } nueva${stats.new_stores_this_month === 1 ? "" : "s"} este mes`,
          description: "Conviene seguir su activacion temprana.",
          href: "/admin/stores?segment=new&sort=newest",
          variant: "info" as const,
        }
      : null,
  ].filter((alert): alert is OverviewAlert => alert !== null);

  // ── Summary cards ─────────────────────────────────────────────────────────

  const summaryCards = [
    {
      label: "Tiendas activas",
      value: stats.active_stores,
      icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
      tone: "bg-green-50 text-green-700",
      helper: `${
        stats.total_stores > 0
          ? Math.round((stats.active_stores / stats.total_stores) * 100)
          : 0
      }% del total`,
      href: "/admin/stores?status=active",
    },
    {
      label: "Tiendas inactivas",
      value: stats.inactive_stores,
      icon: <ShieldX className="w-5 h-5 text-red-600" />,
      tone: "bg-red-50 text-red-700",
      helper: stats.inactive_stores > 0 ? "Requieren revision" : "Sin alertas",
      href: "/admin/stores?status=inactive",
    },
    {
      label: "Nuevas este mes",
      value: stats.new_stores_this_month,
      icon: <StoreIcon className="w-5 h-5 text-indigo-600" />,
      tone: "bg-indigo-50 text-indigo-700",
      helper:
        stats.new_stores_this_month > 0 ? "Altas recientes" : "Sin altas nuevas",
      href: "/admin/stores?segment=new&sort=newest",
    },
    {
      label: "Sin actividad reciente",
      value: stats.stores_without_recent_activity,
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      tone: "bg-amber-50 text-amber-700",
      helper:
        stats.stores_without_recent_activity > 0
          ? "0 pedidos en 30 dias"
          : "Actividad al dia",
      href: "/admin/stores?activity=no-recent",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <PageHeader
          title="Operacion de tiendas"
          subtitle={`${stats.total_stores} tiendas analizadas y ${stats.platform_total_orders} pedidos no cancelados revisados.`}
          className="mb-6"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`inline-flex rounded-2xl p-3 ${card.tone}`}>
                {card.icon}
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 font-display text-3xl font-black text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr,0.95fr] gap-5">
        <Card
          padding={false}
          className="overflow-hidden"
          header={{
            title: "Alertas accionables",
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          }}
        >
          {alerts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Sin alertas operativas
              </p>
              <p className="text-xs text-slate-400 mt-1">
                No hay tiendas para revisar con las reglas actuales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <Link
                  key={alert.href}
                  href={alert.href}
                  className="flex items-start gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="pt-0.5">
                    <Badge variant={alert.variant} size="sm">
                      {alert.variant === "error"
                        ? "Alta"
                        : alert.variant === "warning"
                        ? "Media"
                        : "Info"}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {alert.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card
            padding={false}
            className="overflow-hidden"
            header={{
              title: "Tiendas nuevas",
              icon: <Store className="w-5 h-5 text-indigo-600" />,
              action: (
                <Link
                  href="/admin/stores?segment=new&sort=newest"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  Ver todas
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ),
            }}
          >
            {recentNewStores.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Sin altas nuevas este mes
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNewStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/admin/stores/${store.id}`}
                    className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-slate-600">
                        {store.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatShortDate(store.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={store.total_orders > 0 ? "info" : "warning"}
                      size="sm"
                    >
                      {store.total_orders > 0
                        ? `${store.total_orders} pedidos`
                        : "Sin pedidos"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card
            padding={false}
            className="overflow-hidden"
            header={{
              title: "Tiendas a revisar",
              icon: <Clock className="w-5 h-5 text-amber-500" />,
              action: (
                <Link
                  href="/admin/stores?activity=no-recent"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  Ver todas
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ),
            }}
          >
            {storesToReview.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Sin tiendas detenidas
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {storesToReview.map((store) => (
                  <Link
                    key={store.id}
                    href={`/admin/stores/${store.id}`}
                    className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-slate-600">
                        {store.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {store.last_order_at
                          ? `Ultimo pedido ${formatShortDate(store.last_order_at)}`
                          : "Sin pedidos historicos"}
                      </p>
                    </div>
                    <Badge
                      variant={store.has_orders ? "warning" : "error"}
                      size="sm"
                    >
                      {store.has_orders ? "Sin actividad 30d" : "Sin pedidos"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Resumen rapido
        </span>
        <span>{stats.active_stores} activas</span>
        <span className="text-slate-300">/</span>
        <span>{stats.inactive_stores} inactivas</span>
        <span className="text-slate-300">/</span>
        <span>{stats.stores_without_orders} sin pedidos</span>
        <span className="text-slate-300">/</span>
        <span>
          {formatCurrency(stats.platform_total_revenue)} en ventas analizadas
        </span>
      </div>
    </div>
  );
}
