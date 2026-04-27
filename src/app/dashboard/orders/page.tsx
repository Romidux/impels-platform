import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import Link from "next/link";
import {
  ShoppingCart,
  Clock,
  MessageCircle,
  Download,
  LayoutList,
  Columns3,
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
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OrdersSearchBar } from "@/components/dashboard/OrdersSearchBar";

function ordersUrl(p: {
  status?: string;
  q?: string;
  view?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.q) sp.set("q", p.q);
  if (p.view && p.view !== "list") sp.set("view", p.view);
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
    view?: string;
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
  const view = params.view || "list";
  const page = parseInt(params.page || "1");
  const pageSize = view === "kanban" ? 50 : 20;
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
      small: true,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="dash-card p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}
            >
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              <p
                className={`font-display font-black leading-tight text-slate-900 ${kpi.small ? "text-base" : "text-2xl"}`}
              >
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <OrdersSearchBar defaultValue={q} status={status} view={view} />
        </div>
        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden flex-shrink-0">
          <Link
            href={ordersUrl({ status, q, view: "list" })}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
              view !== "kanban"
                ? "bg-blue-600 text-white shadow-apple-sm hover:bg-blue-700 active:bg-blue-800"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Lista
          </Link>
          <Link
            href={ordersUrl({ status, q, view: "kanban" })}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
              view === "kanban"
                ? "bg-blue-600 text-white shadow-apple-sm hover:bg-blue-700 active:bg-blue-800"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Kanban
          </Link>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={ordersUrl({ status: f.value || undefined, q, view })}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
              status === f.value || (!status && !f.value)
                ? "bg-blue-600 text-white shadow-apple-sm hover:bg-blue-700 active:bg-blue-800"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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
      ) : view === "kanban" ? (
        <KanbanView
          orders={orders as Order[]}
          status={status}
          currency={currency}
          storeName={store.name}
          page={page}
          totalPages={totalPages}
          filteredCount={filteredCount}
          q={q}
          view={view}
        />
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
          view={view}
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
  view,
}: {
  orders: Order[];
  currency: string;
  storeName: string;
  page: number;
  totalPages: number;
  filteredCount: number | null;
  status?: string;
  q?: string;
  view: string;
}) {
  return (
    <div className="space-y-4">
      <div className="dash-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 w-28">
                  Pedido
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Productos
                </th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                  Estado
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Fecha
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
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
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs font-bold text-slate-700">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {order.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell max-w-[240px]">
                      <p className="text-xs text-slate-500 truncate">
                        {itemSummary}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-display font-black text-slate-900">
                        {formatCurrency(order.total, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusChanger orderId={order.id} currentStatus={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString("es-PY", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
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
                          className="text-slate-400 hover:text-brand-600 transition-colors"
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
        <div className="sm:hidden divide-y divide-slate-50">
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
                      className="font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      {order.customer_name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                      {new Date(order.created_at).toLocaleString("es-PY", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="font-display font-black text-slate-900">
                    {formatCurrency(order.total, currency)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                  {items.map((item, i) => (
                    <p key={i} className="text-xs text-slate-600 truncate">
                      <span className="font-bold text-brand-600">
                        {item.quantity}×
                      </span>{" "}
                      {item.product_name}
                      {item.variant_label && (
                        <span className="text-slate-400">
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
                      className="text-slate-400 hover:text-brand-600 transition-colors"
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
        view={view}
      />
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({
  orders,
  status,
  currency,
  storeName,
  page,
  totalPages,
  filteredCount,
  q,
  view,
}: {
  orders: Order[];
  status?: string;
  currency: string;
  storeName: string;
  page: number;
  totalPages: number;
  filteredCount: number | null;
  q?: string;
  view: string;
}) {
  const cols = STATUS_FILTERS.filter((f) => f.value !== "");

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className={`flex gap-4 ${status ? "flex-col lg:flex-row" : "flex-col lg:flex-row min-w-[1000px]"}`}
      >
        {cols
          .filter((f) => !status || f.value === status)
          .map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.value);

            if (columnOrders.length === 0 && !status) {
              return (
                <div
                  key={col.value}
                  className="hidden lg:flex flex-col w-full min-w-[300px] bg-[#F5F5F7] rounded-2xl p-3"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-slate-700 text-sm">
                      {col.label}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                      0
                    </span>
                  </div>
                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center py-10">
                    <p className="text-xs text-slate-400 font-medium tracking-wide">
                      Vacío
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={col.value}
                className="flex flex-col flex-1 w-full lg:min-w-[320px] bg-transparent lg:bg-[#F5F5F7] lg:p-3 lg:rounded-2xl gap-3"
              >
                <div className="hidden lg:flex items-center justify-between mb-1 px-1">
                  <h3 className="font-semibold text-slate-600 text-sm">
                    {col.label}
                  </h3>
                  <span className="text-xs font-bold text-slate-600 bg-white shadow-sm border border-slate-200 px-2 py-0.5 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                {columnOrders.map((order) => {
                  const whatsappLink = order.customer_phone
                    ? `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=Hola+${encodeURIComponent(order.customer_name)}+somos+${encodeURIComponent(storeName)},+les+escribimos+sobre+su+pedido.`
                    : null;

                  return (
                    <div
                      key={order.id}
                      className="dash-card flex flex-col p-4 hover:shadow-md transition-shadow gap-3 bg-white"
                    >
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-start justify-between group"
                      >
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {order.customer_name}
                          </span>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-black text-lg text-slate-900 leading-none mb-1">
                            {formatCurrency(order.total, currency)}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString(
                              "es-PY",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </Link>

                      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100">
                        {(
                          order.items as {
                            product_name: string;
                            quantity: number;
                            variant_label?: string;
                          }[]
                        ).map((item, i) => (
                          <div
                            key={i}
                            className="text-xs text-slate-600 flex items-start gap-2"
                          >
                            <span className="font-bold text-brand-600">
                              {item.quantity}×
                            </span>
                            <span className="truncate flex-1">
                              {item.product_name}
                              {item.variant_label && (
                                <span className="text-slate-400 ml-1">
                                  ({item.variant_label})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100 gap-2">
                        {whatsappLink ? (
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                          >
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-4 h-4 mr-1.5" />
                              Contactar
                            </a>
                          </Button>
                        ) : (
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                          >
                            Ver detalle
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        <OrderStatusChanger
                          orderId={order.id}
                          currentStatus={order.status as OrderStatus}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        filteredCount={filteredCount}
        status={status}
        q={q}
        view={view}
        className="mt-4"
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
  view,
  className = "",
}: {
  page: number;
  totalPages: number;
  filteredCount: number | null;
  status?: string;
  q?: string;
  view: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div
      className={`dash-card flex items-center justify-between px-5 py-3 text-sm text-slate-500 ${className}`}
    >
      <span>
        Página {page} de {totalPages} ({filteredCount} pedidos)
      </span>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link
            href={ordersUrl({ status, q, view, page: page - 1 })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            ← Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={ordersUrl({ status, q, view, page: page + 1 })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}
