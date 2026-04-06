import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Store,
  Search,
  ArrowRight,
  Clock,
  ShoppingCart,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

// ── Types returned by the get_admin_stores() RPC ────────────────────────────

type AdminStoreTotals = {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  no_orders_stores: number;
  no_recent_stores: number;
};

type AdminStoreRow = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_revenue: number;
  orders_last_30d: number;
  last_order_at: string | null;
  is_new_store: boolean;
};

type AdminStoresData = {
  totals: AdminStoreTotals;
  filtered_count: number;
  stores: AdminStoreRow[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getActivityBadge(store: AdminStoreRow) {
  if (store.total_orders === 0) {
    return <Badge variant="error" size="sm">Sin pedidos</Badge>;
  }
  if (store.orders_last_30d === 0) {
    return <Badge variant="warning" size="sm">Sin actividad 30d</Badge>;
  }
  if (store.is_new_store) {
    return <Badge variant="info" size="sm">Nueva</Badge>;
  }
  return <Badge variant="success" size="sm">Activa reciente</Badge>;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    segment?: string;
    activity?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const q        = (params.q || "").trim();
  const status   = params.status   || "all";
  const segment  = params.segment  || "all";
  const activity = params.activity || "all";
  const sort     = params.sort     || "newest";
  const page     = Math.max(1, Number(params.page) || 1);

  const adminClient = createAdminClient();

  // Single RPC replaces two full-table fetches + JS Map aggregation + JS sort.
  // See supabase/migrations/016_admin_stores_rpc.sql
  const { data: storesRaw, error } = await adminClient.rpc("get_admin_stores", {
    p_q:         q || null,
    p_status:    status,
    p_segment:   segment,
    p_activity:  activity,
    p_sort:      sort,
    p_page:      page,
    p_page_size: PAGE_SIZE,
  });

  if (error) {
    throw new Error(`get_admin_stores RPC failed: ${error.message}`);
  }

  const {
    totals,
    filtered_count: filteredCount,
    stores,
  } = storesRaw as AdminStoresData;

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE);

  // ── URL builders ──────────────────────────────────────────────────────────

  // Used by filter pills and "clear filters". Always resets to page 1.
  const buildUrl = (next: Record<string, string>) => {
    const search = new URLSearchParams();
    const merged = { q, status, segment, activity, sort, ...next };

    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== "all" && !(key === "sort" && value === "newest")) {
        search.set(key, value);
      }
    });

    const query = search.toString();
    return `/admin/stores${query ? `?${query}` : ""}`;
  };

  // Used by pagination controls. Preserves all active filters.
  const buildPageUrl = (targetPage: number) => {
    const search = new URLSearchParams();
    if (q)               search.set("q",        q);
    if (status   !== "all") search.set("status",   status);
    if (segment  !== "all") search.set("segment",  segment);
    if (activity !== "all") search.set("activity", activity);
    if (sort     !== "newest") search.set("sort",  sort);
    if (targetPage > 1)  search.set("page",     String(targetPage));
    const query = search.toString();
    return `/admin/stores${query ? `?${query}` : ""}`;
  };

  const hasFilters = Boolean(
    q || status !== "all" || segment !== "all" || activity !== "all" || sort !== "newest"
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Operacion de tiendas"
        subtitle={`${filteredCount} resultado${filteredCount === 1 ? "" : "s"} sobre ${totals.total_stores} tiendas.`}
        actions={
          hasFilters ? (
            <Link
              href="/admin/stores"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar filtros
            </Link>
          ) : undefined
        }
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        {/* Summary mini-cards — always reflect ALL stores, not the current filter */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Activas",           value: totals.active_stores },
            { label: "Inactivas",         value: totals.inactive_stores },
            { label: "Sin pedidos",       value: totals.no_orders_stores },
            { label: "Sin actividad 30d", value: totals.no_recent_stores },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 font-display text-2xl font-black text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter form */}
        <form
          method="get"
          className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.4fr,0.9fr,0.9fr,0.9fr,0.9fr] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre o slug..."
                className="dash-input pl-10 bg-white"
              />
            </div>

            <select name="status" defaultValue={status} className="dash-input bg-white">
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>

            <select name="segment" defaultValue={segment} className="dash-input bg-white">
              <option value="all">Todos los segmentos</option>
              <option value="new">Nuevas este mes</option>
            </select>

            <select name="activity" defaultValue={activity} className="dash-input bg-white">
              <option value="all">Toda la actividad</option>
              <option value="no-orders">Sin pedidos</option>
              <option value="no-recent">Sin actividad reciente</option>
              <option value="recent">Con actividad reciente</option>
            </select>

            <select name="sort" defaultValue={sort} className="dash-input bg-white">
              <option value="newest">Mas nuevas</option>
              <option value="oldest">Mas antiguas</option>
              <option value="orders">Mas pedidos</option>
              <option value="revenue">Mas ventas</option>
              <option value="last-order">Ultimo pedido</option>
              <option value="name">Nombre</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Aplicar filtros
            </button>
            <Link
              href={buildUrl({ status: "active" })}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200"
            >
              Activas
            </Link>
            <Link
              href={buildUrl({ activity: "no-orders" })}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200"
            >
              Sin pedidos
            </Link>
            <Link
              href={buildUrl({ activity: "no-recent" })}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200"
            >
              Sin actividad 30d
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Tiendas
            </h2>
            <p className="text-sm text-slate-500">
              Vista operativa con foco en estado, actividad y ventas.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {filteredCount} resultados
          </span>
        </div>

        {stores.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Store className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              No hay tiendas para los filtros actuales
            </p>
            {hasFilters && (
              <Link
                href="/admin/stores"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 mt-3"
              >
                Restablecer vista
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-5 py-3">
                      Tienda
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Estado
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Actividad
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Pedidos
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Ultimo pedido
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Ventas
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-4 py-3">
                      Creada
                    </th>
                    <th className="text-right text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-5 py-3">
                      Accion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((store) => (
                    <tr
                      key={store.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-slate-600">
                              {store.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-slate-900 truncate">
                                {store.name}
                              </p>
                              <Badge
                                variant={store.plan === "pro" ? "brand" : "neutral"}
                                size="sm"
                              >
                                {store.plan === "pro" ? "Pro" : "Free"}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-1">
                              {store.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={store.is_active ? "success" : "error"}
                          dot
                          size="sm"
                        >
                          {store.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {getActivityBadge(store)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{store.total_orders}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {store.last_order_at ? (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatShortDate(store.last_order_at)}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(store.total_revenue)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatShortDate(store.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/stores/${store.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                        >
                          Ver detalle
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                <p className="text-sm text-slate-500">
                  Página {page} de {totalPages}
                  <span className="text-slate-400 ml-1">· {filteredCount} tiendas</span>
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link href={buildPageUrl(page - 1)}>
                      <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-300 cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </span>
                  )}
                  {page < totalPages ? (
                    <Link href={buildPageUrl(page + 1)}>
                      <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-300 cursor-not-allowed">
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
