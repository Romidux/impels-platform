import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingCart, Clock, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/lib/types";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import OrderStatusChanger from "@/components/dashboard/OrderStatusChanger";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { DashEmptyState } from "@/components/dashboard/ui/DashEmptyState";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const params = await searchParams;
  const { status } = params;
  const page = parseInt(params.page || "1");
  const pageSize = 20;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, count: totalCount } = await query;
  const currency = store.store_settings?.[0]?.currency || "Gs";
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  const statusFilters: { value: string; label: string }[] = [
    { value: "", label: "Todos" },
    { value: "new", label: "Nuevos" },
    { value: "confirmed", label: "Confirmados" },
    { value: "processing", label: "En proceso" },
    { value: "delivered", label: "Entregados" },
    { value: "cancelled", label: "Cancelados" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Pedidos"
        subtitle={`${totalCount || 0} pedidos${status ? ` con estado "${status}"` : ""}`}
      />

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={
              f.value ? `/dashboard/orders?status=${f.value}` : "/dashboard/orders"
            }
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
              status === f.value || (!status && !f.value)
                ? "bg-green-800 text-white shadow-sm"
                : "bg-white border border-gray-200 text-slate-600 hover:border-green-300 hover:text-green-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Orders list */}
      {!orders || orders.length === 0 ? (
        <div className="dash-card">
          <DashEmptyState
            icon={<ShoppingCart className="w-7 h-7 text-green-600" />}
            title={`Sin pedidos${status ? ` con estado "${status}"` : ""}`}
            description="Los pedidos de tus clientes aparecerán aquí"
          />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {(orders as Order[]).map((order) => (
              <div
                key={order.id}
                className="p-5 hover:bg-slate-50/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4.5 h-4.5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {order.customer_name}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        📞 {order.customer_phone}
                        {order.customer_address &&
                          ` • 📍 ${order.customer_address}`}
                      </p>

                      {/* Items */}
                      <div className="mt-3 space-y-1">
                        {(order.items as { product_name: string; quantity: number; unit_price: number; variant_label?: string }[]).map((item, i) => (
                          <div
                            key={i}
                            className="text-sm text-slate-600 flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center flex-shrink-0">
                              {item.quantity}
                            </span>
                            <span className="truncate">
                              {item.product_name}
                              {item.variant_label && (
                                <span className="text-slate-400">
                                  {" "}
                                  ({item.variant_label})
                                </span>
                              )}
                            </span>
                            <span className="ml-auto font-medium text-slate-700 whitespace-nowrap">
                              {formatCurrency(item.unit_price * item.quantity, currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer_notes && (
                        <p className="mt-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                          💬 {order.customer_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-black text-xl text-slate-900">
                      {formatCurrency(order.total, currency)}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString("es-PY", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    <OrderStatusChanger
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-slate-500">
              <span>
                Página {page} de {totalPages} ({totalCount} pedidos)
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard/orders?${status ? `status=${status}&` : ""}page=${page - 1}`}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/dashboard/orders?${status ? `status=${status}&` : ""}page=${page + 1}`}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
