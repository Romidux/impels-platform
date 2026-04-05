import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  ExternalLink,
  Clock,
  User,
  Store,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getStoreUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToggleStoreButton } from "./ToggleStoreButton";
import { ImpersonateButton } from "./ImpersonateButton";
import { DeleteStoreButton } from "./DeleteStoreButton";

type StoreDetailRow = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  owner_id: string;
  disabled_reason?: string | null;
  disabled_at?: string | null;
  auth_users?: { email?: string | null } | null;
  store_settings?:
    | {
        whatsapp_number?: string | null;
        template?: string | null;
        currency?: string | null;
      }[]
    | {
        whatsapp_number?: string | null;
        template?: string | null;
        currency?: string | null;
      }
    | null;
};

type StoreOrderRow = {
  id: string;
  total: number | null;
  created_at: string;
  customer_name: string | null;
  status: string;
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

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: string) {
  switch (status) {
    case "new":
      return { label: "Nuevo", variant: "info" as const };
    case "confirmed":
      return { label: "Confirmado", variant: "brand" as const };
    case "processing":
      return { label: "En proceso", variant: "warning" as const };
    case "delivered":
      return { label: "Entregado", variant: "success" as const };
    default:
      return { label: status, variant: "neutral" as const };
  }
}

function getSignalColor(variant: "success" | "warning" | "error" | "info" | "neutral") {
  switch (variant) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    case "info":
      return "bg-blue-500";
    default:
      return "bg-slate-300";
  }
}

export default async function AdminStoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verify session (auth check only — data fetched via admin client below)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client to bypass RLS — admin needs to read any store
  const adminClient = createAdminClient();

  const [{ data: store }, { data: orders }] = await Promise.all([
    adminClient
      .from("stores")
      .select("id, name, slug, plan, is_active, created_at, owner_id, disabled_reason, disabled_at, store_settings(*), auth_users:owner_id(email)")
      .eq("id", id)
      .single(),
    adminClient
      .from("orders")
      .select("id, total, created_at, customer_name, status")
      .eq("store_id", id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
  ]);

  if (!store) notFound();

  const typedStore = store as StoreDetailRow;
  const allOrders = (orders || []) as StoreOrderRow[];
  const settings = Array.isArray(typedStore.store_settings)
    ? typedStore.store_settings[0]
    : typedStore.store_settings;

  const recentThreshold = getDateDaysAgo(RECENT_ACTIVITY_DAYS);
  const monthStart = getMonthStart();
  const storeUrl = getStoreUrl(typedStore.slug);
  const ownerEmail = typedStore.auth_users?.email || "Email no disponible";

  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const ordersLast30Days = allOrders.filter(
    (order) => new Date(order.created_at) >= recentThreshold
  );
  const revenueLast30Days = ordersLast30Days.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );
  const lastOrderAt = allOrders[0]?.created_at || null;
  const isNewStore = new Date(typedStore.created_at) >= monthStart;
  const hasRecentActivity = ordersLast30Days.length > 0;
  const hasWhatsApp = Boolean(settings?.whatsapp_number);
  const hasTemplate = Boolean(settings?.template);
  const recentOrders = allOrders.slice(0, 8);

  const summaryCards = [
    {
      label: "Pedidos totales",
      value: `${totalOrders}`,
      helper: totalOrders > 0 ? "Historico no cancelado" : "Sin pedidos registrados",
      icon: <ShoppingCart className="w-4 h-4 text-indigo-600" />,
      iconTone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Ventas acumuladas",
      value: formatCurrency(totalRevenue, settings?.currency || "Gs"),
      helper: "Ingresos analizados",
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      iconTone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Pedidos 30 dias",
      value: `${ordersLast30Days.length}`,
      helper: hasRecentActivity ? "Actividad reciente" : "Sin actividad reciente",
      icon: <Store className="w-4 h-4 text-sky-600" />,
      iconTone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Ultimo pedido",
      value: lastOrderAt ? formatShortDate(lastOrderAt) : "Sin pedidos",
      helper: lastOrderAt ? "Ultima referencia operativa" : "Aun sin ventas",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      iconTone: "bg-amber-50 text-amber-700",
    },
  ];

  const operationalItems = [
    {
      label: "Estado de la tienda",
      value: typedStore.is_active ? "Activa" : "Inactiva",
      variant: typedStore.is_active ? "success" : "error",
    },
    {
      label: "Nueva este mes",
      value: isNewStore ? "Alta reciente" : "No",
      variant: isNewStore ? "info" : "neutral",
    },
    {
      label: "Pedidos historicos",
      value: totalOrders > 0 ? `${totalOrders} pedidos` : "Sin pedidos",
      variant: totalOrders > 0 ? "success" : "error",
    },
    {
      label: "Actividad reciente",
      value: hasRecentActivity
        ? `${ordersLast30Days.length} pedidos en 30 dias`
        : "0 pedidos en 30 dias",
      variant: hasRecentActivity ? "success" : "warning",
    },
    {
      label: "Ventas ultimos 30 dias",
      value: formatCurrency(revenueLast30Days, settings?.currency || "Gs"),
      variant: revenueLast30Days > 0 ? "success" : "neutral",
    },
  ] as const;

  const configurationItems = [
    {
      label: "Propietario",
      value: ownerEmail,
      muted: false,
    },
    {
      label: "URL de tienda",
      value: storeUrl,
      href: storeUrl,
      muted: false,
    },
    {
      label: "WhatsApp",
      value: settings?.whatsapp_number || "No configurado",
      muted: !settings?.whatsapp_number,
    },
    {
      label: "Template",
      value: settings?.template || "No configurado",
      muted: !settings?.template,
    },
    {
      label: "Moneda",
      value: settings?.currency || "Gs",
      muted: false,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a tiendas
        </Link>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 p-6 lg:p-7">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm flex-shrink-0">
                  <span className="text-2xl font-black text-slate-700">
                    {typedStore.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                    <h1 className="font-display text-[28px] font-black leading-tight text-slate-950">
                      {typedStore.name}
                    </h1>
                    <Badge variant={typedStore.is_active ? "success" : "error"} dot>
                      {typedStore.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                    <Badge
                      variant={typedStore.plan === "pro" ? "brand" : "neutral"}
                    >
                      {typedStore.plan === "pro" ? "Plan Pro" : "Plan Free"}
                    </Badge>
                    {isNewStore && <Badge variant="info">Nueva este mes</Badge>}
                    {!hasRecentActivity && (
                      <Badge variant={totalOrders > 0 ? "warning" : "error"}>
                        {totalOrders > 0 ? "Sin actividad 30d" : "Sin pedidos"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Ficha operativa para revisar estado, configuracion y actividad reciente de la tienda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Propietario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
                    {ownerEmail}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Creada
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatShortDate(typedStore.created_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    URL
                  </p>
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 break-all"
                  >
                    {typedStore.slug}
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            <div className="xl:w-[320px] rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Acciones
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Accesos y controles directos sobre esta tienda.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ImpersonateButton
                  storeId={typedStore.id}
                  storeName={typedStore.name}
                  ownerEmail={ownerEmail}
                />
                <ToggleStoreButton
                  storeId={typedStore.id}
                  isActive={typedStore.is_active}
                  disabledReason={typedStore.disabled_reason}
                />
                <DeleteStoreButton
                  storeId={typedStore.id}
                  storeName={typedStore.name}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`inline-flex rounded-2xl p-3 ${card.iconTone}`}>{card.icon}</div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-2 font-display text-[28px] font-black leading-tight text-slate-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[0.92fr,1.08fr] gap-5">
        <Card
          className="overflow-hidden"
          header={{
            title: "Estado operativo",
            icon: <ShieldAlert className="w-5 h-5 text-amber-500" />,
          }}
        >
          <div className="divide-y divide-slate-100">
            {operationalItems.map((item, index) => (
              <div
                key={item.label}
                className={`grid grid-cols-[minmax(0,1fr),auto] items-start gap-4 ${
                  index === 0 ? "pt-0" : "pt-4"
                } ${index === operationalItems.length - 1 ? "pb-0" : "pb-4"}`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${getSignalColor(item.variant)}`}
                  />
                  <span className="text-sm font-medium text-slate-500">
                    {item.variant === "success"
                      ? "OK"
                      : item.variant === "warning"
                      ? "Atencion"
                      : item.variant === "error"
                      ? "Critico"
                      : item.variant === "info"
                      ? "Nuevo"
                      : "Base"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!typedStore.is_active && typedStore.disabled_reason && (
            <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-500">
                Motivo de suspensión
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-900">
                {typedStore.disabled_reason}
              </p>
              {typedStore.disabled_at && (
                <p className="mt-0.5 text-xs text-amber-600">
                  Desde {formatShortDate(typedStore.disabled_at)}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Disponibilidad comercial
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={hasWhatsApp ? "success" : "neutral"} size="sm">
                {hasWhatsApp ? "WhatsApp listo" : "WhatsApp pendiente"}
              </Badge>
              <Badge variant={hasTemplate ? "success" : "neutral"} size="sm">
                {hasTemplate ? "Template listo" : "Template pendiente"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card
          className="overflow-hidden"
          header={{
            title: "Configuracion disponible",
            icon: <User className="w-5 h-5 text-indigo-600" />,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {configurationItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex break-all text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p
                    className={`mt-2 break-all text-sm font-semibold ${
                      item.muted ? "text-slate-500" : "text-slate-900"
                    }`}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        padding={false}
        className="overflow-hidden"
        header={{
          title: "Actividad reciente",
          icon: <ShoppingCart className="w-5 h-5 text-indigo-600" />,
        }}
      >
        {allOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-6 h-6" />}
            heading="Sin pedidos registrados"
            description="Esta tienda todavia no tiene pedidos no cancelados para analizar."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const statusMeta = getStatusMeta(order.status);
              const customerInitial = (order.customer_name || "C").charAt(0).toUpperCase();
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-1 gap-3 px-6 py-4 transition-colors hover:bg-slate-50/80 sm:grid-cols-[minmax(0,1.45fr),auto,auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">
                      {customerInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {order.customer_name || "Cliente sin nombre"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatShortDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="sm:justify-self-start">
                    <Badge variant={statusMeta.variant} size="sm">
                      {statusMeta.label}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 sm:justify-self-end">
                    {formatCurrency(order.total || 0, settings?.currency || "Gs")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
