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

type AdminStoreRow = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
};

type AdminOrderRow = {
  id: string;
  store_id: string;
  total: number | null;
  created_at: string;
};

type DecoratedStore = AdminStoreRow & {
  totalOrders: number;
  totalRevenue: number;
  ordersLast30Days: number;
  lastOrderAt: string | null;
  isNewStore: boolean;
  hasRecentActivity: boolean;
  hasOrders: boolean;
};

type OverviewAlert = {
  title: string;
  description: string;
  href: string;
  variant: "error" | "warning" | "info";
};

const RECENT_ACTIVITY_DAYS = 30;

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function getMonthStart() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildStoreOrderStats(orders: AdminOrderRow[]) {
  const recentThreshold = getDateDaysAgo(RECENT_ACTIVITY_DAYS);
  const stats = new Map<
    string,
    {
      totalOrders: number;
      totalRevenue: number;
      ordersLast30Days: number;
      lastOrderAt: string | null;
    }
  >();

  for (const order of orders) {
    const current = stats.get(order.store_id) || {
      totalOrders: 0,
      totalRevenue: 0,
      ordersLast30Days: 0,
      lastOrderAt: null,
    };

    current.totalOrders += 1;
    current.totalRevenue += order.total || 0;

    const createdAt = new Date(order.created_at);
    if (createdAt >= recentThreshold) {
      current.ordersLast30Days += 1;
    }

    if (!current.lastOrderAt || createdAt > new Date(current.lastOrderAt)) {
      current.lastOrderAt = order.created_at;
    }

    stats.set(order.store_id, current);
  }

  return stats;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [{ data: stores }, { data: orders }] = await Promise.all([
    adminClient
      .from("stores")
      .select("id, name, slug, plan, is_active, created_at")
      .order("created_at", { ascending: false }),
    adminClient
      .from("orders")
      .select("id, store_id, total, created_at")
      .neq("status", "cancelled"),
  ]);

  const allStores = (stores || []) as AdminStoreRow[];
  const allOrders = (orders || []) as AdminOrderRow[];

  const monthStart = getMonthStart();
  const orderStats = buildStoreOrderStats(allOrders);

  const decoratedStores: DecoratedStore[] = allStores.map((store) => {
    const stats = orderStats.get(store.id);
    const totalOrders = stats?.totalOrders || 0;
    const totalRevenue = stats?.totalRevenue || 0;
    const ordersLast30Days = stats?.ordersLast30Days || 0;
    const lastOrderAt = stats?.lastOrderAt || null;
    const isNewStore = new Date(store.created_at) >= monthStart;

    return {
      ...store,
      totalOrders,
      totalRevenue,
      ordersLast30Days,
      lastOrderAt,
      isNewStore,
      hasRecentActivity: ordersLast30Days > 0,
      hasOrders: totalOrders > 0,
    };
  });

  const totalStores = decoratedStores.length;
  const activeStores = decoratedStores.filter((store) => store.is_active);
  const inactiveStores = decoratedStores.filter((store) => !store.is_active);
  const newStores = decoratedStores.filter((store) => store.isNewStore);
  const storesWithoutOrders = decoratedStores.filter((store) => !store.hasOrders);
  const storesWithoutRecentActivity = decoratedStores.filter(
    (store) => store.ordersLast30Days === 0
  );

  const recentNewStores = [...newStores]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const storesToReview = [...storesWithoutRecentActivity]
    .sort((a, b) => {
      if (a.hasOrders !== b.hasOrders) {
        return a.hasOrders ? 1 : -1;
      }

      if (a.lastOrderAt && b.lastOrderAt) {
        return (
          new Date(a.lastOrderAt).getTime() - new Date(b.lastOrderAt).getTime()
        );
      }

      if (!a.lastOrderAt && !b.lastOrderAt) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return a.lastOrderAt ? 1 : -1;
    })
    .slice(0, 5);

  const alerts = [
    inactiveStores.length > 0
      ? {
          title: `${inactiveStores.length} tienda${
            inactiveStores.length === 1 ? "" : "s"
          } inactiva${inactiveStores.length === 1 ? "" : "s"}`,
          description: "Revisa si deben reactivarse o mantenerse suspendidas.",
          href: "/admin/stores?status=inactive",
          variant: "error" as const,
        }
      : null,
    storesWithoutOrders.length > 0
      ? {
          title: `${storesWithoutOrders.length} tienda${
            storesWithoutOrders.length === 1 ? "" : "s"
          } sin pedidos`,
          description: "Detecta onboarding incompleto o falta de activacion.",
          href: "/admin/stores?activity=no-orders",
          variant: "warning" as const,
        }
      : null,
    storesWithoutRecentActivity.length > 0
      ? {
          title: `${storesWithoutRecentActivity.length} tienda${
            storesWithoutRecentActivity.length === 1 ? "" : "s"
          } sin actividad reciente`,
          description: "No registran pedidos en los ultimos 30 dias.",
          href: "/admin/stores?activity=no-recent",
          variant: "warning" as const,
        }
      : null,
    newStores.length > 0
      ? {
          title: `${newStores.length} tienda${
            newStores.length === 1 ? "" : "s"
          } nueva${newStores.length === 1 ? "" : "s"} este mes`,
          description: "Conviene seguir su activacion temprana.",
          href: "/admin/stores?segment=new&sort=newest",
          variant: "info" as const,
        }
      : null,
  ].filter((alert): alert is OverviewAlert => alert !== null);

  const summaryCards = [
    {
      label: "Tiendas activas",
      value: activeStores.length,
      icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
      tone: "bg-green-50 text-green-700",
      helper: `${totalStores > 0 ? Math.round((activeStores.length / totalStores) * 100) : 0}% del total`,
      href: "/admin/stores?status=active",
    },
    {
      label: "Tiendas inactivas",
      value: inactiveStores.length,
      icon: <ShieldX className="w-5 h-5 text-red-600" />,
      tone: "bg-red-50 text-red-700",
      helper: inactiveStores.length > 0 ? "Requieren revision" : "Sin alertas",
      href: "/admin/stores?status=inactive",
    },
    {
      label: "Nuevas este mes",
      value: newStores.length,
      icon: <StoreIcon className="w-5 h-5 text-indigo-600" />,
      tone: "bg-indigo-50 text-indigo-700",
      helper: newStores.length > 0 ? "Altas recientes" : "Sin altas nuevas",
      href: "/admin/stores?segment=new&sort=newest",
    },
    {
      label: "Sin actividad reciente",
      value: storesWithoutRecentActivity.length,
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      tone: "bg-amber-50 text-amber-700",
      helper:
        storesWithoutRecentActivity.length > 0
          ? "0 pedidos en 30 dias"
          : "Actividad al dia",
      href: "/admin/stores?activity=no-recent",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <PageHeader
          title="Operacion de tiendas"
          subtitle={`${totalStores} tiendas analizadas y ${allOrders.length} pedidos no cancelados revisados.`}
          className="mb-6"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`inline-flex rounded-2xl p-3 ${card.tone}`}>{card.icon}</div>
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
                      variant={store.hasOrders ? "info" : "warning"}
                      size="sm"
                    >
                      {store.hasOrders ? `${store.totalOrders} pedidos` : "Sin pedidos"}
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
                        {store.lastOrderAt
                          ? `Ultimo pedido ${formatShortDate(store.lastOrderAt)}`
                          : "Sin pedidos historicos"}
                      </p>
                    </div>
                    <Badge
                      variant={store.hasOrders ? "warning" : "error"}
                      size="sm"
                    >
                      {store.hasOrders ? "Sin actividad 30d" : "Sin pedidos"}
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
        <span>{activeStores.length} activas</span>
        <span className="text-slate-300">/</span>
        <span>{inactiveStores.length} inactivas</span>
        <span className="text-slate-300">/</span>
        <span>{storesWithoutOrders.length} sin pedidos</span>
        <span className="text-slate-300">/</span>
        <span>{formatCurrency(allOrders.reduce((sum, order) => sum + (order.total || 0), 0))} en ventas analizadas</span>
      </div>
    </div>
  );
}
