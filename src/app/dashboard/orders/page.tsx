import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import Link from "next/link";
import {
  ShoppingCart,
  Clock,
  MessageCircle,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/lib/types";
import OrderStatusChanger from "@/components/dashboard/OrderStatusChanger";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OrdersSearchBar } from "@/components/dashboard/OrdersSearchBar";

function ordersUrl(p: {
  status?: string;
  q?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return `/dashboard/orders${qs ? "?" + qs : ""}`;
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "new", label: "Nuevos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "processing", label: "En proceso" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const store = await getStore(user.id);
  if (!store) redirect("/onboarding");

  const supabase = await createClient();
  const params = await searchParams;
  const { status, q } = params;
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const currency = store.store_settings?.[0]?.currency || "Gs";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // KPI queries + main query in parallel
  const [
    { count: totalOrders },
    { count: pendingCount },
    { count: deliveredTodayCount },
    { data: revenueRows },
    ordersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .in("status", ["new", "confirmed"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("status", "delivered")
      .gte("updated_at", todayStart.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", store.id)
      .neq("status", "cancelled"),
    (() => {
      let query = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (status) query = query.eq("status", status);
      if (q) query = query.or(`customer_name.ilike.%${q}%,id.ilike.%${q}%`);
      return query;
    })(),
  ]);

  const totalRevenue =
    revenueRows?.reduce((s, o) => s + (o.total || 0), 0) || 0;
  const { data: orders, count: filteredCount } = ordersResult;
  const totalPages = Math.ceil((filteredCount || 0) / pageSize);

  const activeStatusLabel = STATUS_FILTERS.find((f) => f.value === status)?.label;

  const kpis = [
    {
      label: "Total pedidos",
      value: String(totalOrders || 0),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "text-brand-600 bg-brand-50",
    },
    {
      label: "Pendientes",
      value: String(pendingCount || 0),
      icon: <AlertCircle className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Entregados hoy",
      value: String(deliveredTodayCount || 0),
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Ingresos totales",
      value: formatCurrency(totalRevenue, currency),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Pedidos"
        subtitle={`${filteredCount || 0} pedido${(filteredCount || 0) !== 1 ? "s" : ""}${activeStatusLabel ? ` · ${activeStatusLabel}` : ""}${q ? ` · "${q}"` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              <a href="/api/export?type=orders" download>
                Exportar
              </a>
            </Button>
            <Button asChild icon={<Plus className="w-4 h-4" />}>
              <Link href="/dashboard/orders/new">Nuevo pedido</Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            iconClassName={kpi.color}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <OrdersSearchBar defaultValue={q} status={status} />
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={ordersUrl({ status: f.value || undefined, q })}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              status === f.value || (!status && !f.value)
                ? "bg-brand-600 text-white shadow-apple-sm hover:bg-brand-700 active:bg-brand-800"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {!orders || orders.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8" />}
            heading={`Sin pedidos${activeStatusLabel ? ` · ${activeStatusLabel}` : ""}${q ? ` para "${q}"` : ""}`}
            description="Los pedidos de tus clientes aparecerán aquí."
          />
        </div>
      ) : (
        <ListView
          orders={orders as Order[]}
          currency={currency}
          storeName={store.name}
          page={page}
          totalPages={totalPages}
          filteredCount={filteredCount}
          status={status}
          q={q}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  orders,
  currency,
  storeName,
  page,
  totalPages,
  filteredCount,
  status,
  q,
}: {
  orders: Order[];
  currency: string;
  storeName: string;
  page: number;
  totalPages: number;
  filteredCount: number | null;
  status?: string;
  q?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="dash-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wider px-6 py-3 w-28">
                  Pedido
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wider px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Productos
                </th>
                <th className="text-right text-2xs font-medium text-neutral-400 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wider px-4 py-3">
                  Estado
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Fecha
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.map((order) => {
                const whatsappLink = order.customer_phone
                  ? `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=Hola+${encodeURIComponent(order.customer_name)}+somos+${encodeURIComponent(storeName)},+les+escribimos+sobre+su+pedido.`
                  : null;
                const items = order.items as {
                  product_name: string;
                  quantity: number;
                  variant_label?: string;
                }[];
                const itemSummary = items
                  .map((i) => `${i.quantity}× ${i.product_name}`)
                  .join(", ");

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <p className="font-mono text-xs font-semibold text-neutral-700">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-semibold text-neutral-900 hover:text-brand-600 transition-colors"
                      >
                        {order.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-[240px]">
                      <p className="text-xs text-neutral-500 truncate">
                        {itemSummary}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-semibold text-neutral-900">
                        {formatCurrency(order.total, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusChanger orderId={order.id} currentStatus={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString("es-PY", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {whatsappLink && (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-700 transition-colors"
                            title="Contactar por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-neutral-400 hover:text-brand-600 transition-colors"
                          title="Ver detalle"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-neutral-50">
          {orders.map((order) => {
            const whatsappLink = order.customer_phone
              ? `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=Hola+${encodeURIComponent(order.customer_name)}+somos+${encodeURIComponent(storeName)},+les+escribimos+sobre+su+pedido.`
              : null;
            const items = order.items as {
              product_name: string;
              quantity: number;
              variant_label?: string;
            }[];

            return (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-semibold text-neutral-900 hover:text-brand-600 transition-colors"
                    >
                      {order.customer_name}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                      {new Date(order.created_at).toLocaleString("es-PY", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="font-display font-semibold text-neutral-900">
                    {formatCurrency(order.total, currency)}
                  </span>
                </div>
                <div className="bg-neutral-50 rounded-xl px-3 py-2 space-y-1">
                  {items.map((item, i) => (
                    <p key={i} className="text-xs text-neutral-600 truncate">
                      <span className="font-semibold text-brand-600">
                        {item.quantity}×
                      </span>{" "}
                      {item.product_name}
                      {item.variant_label && (
                        <span className="text-neutral-400">
                          {" "}
                          ({item.variant_label})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <OrderStatusChanger orderId={order.id} currentStatus={order.status as OrderStatus} />
                  <div className="flex items-center gap-3">
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-neutral-400 hover:text-brand-600 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        filteredCount={filteredCount}
        status={status}
        q={q}
      />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  filteredCount,
  status,
  q,
  className = "",
}: {
  page: number;
  totalPages: number;
  filteredCount: number | null;
  status?: string;
  q?: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div
      className={`dash-card flex items-center justify-between px-5 py-3 text-sm text-neutral-500 ${className}`}
    >
      <span>
        Página {page} de {totalPages} ({filteredCount} pedidos)
      </span>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link
            href={ordersUrl({ status, q, page: page - 1 })}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
          >
            ← Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={ordersUrl({ status, q, page: page + 1 })}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}
