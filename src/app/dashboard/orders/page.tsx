import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingCart, Clock, ArrowRight, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/lib/types";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import OrderStatusChanger from "@/components/dashboard/OrderStatusChanger";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
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

  let query = supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders } = await query;
  const currency = store.store_settings?.[0]?.currency || "Gs";

  const statusFilters: { value: string; label: string }[] = [
    { value: "", label: "Todos" },
    { value: "new", label: "Nuevos" },
    { value: "confirmed", label: "Confirmados" },
    { value: "processing", label: "En proceso" },
    { value: "delivered", label: "Entregados" },
    { value: "cancelled", label: "Cancelados" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Pedidos
          </h1>
          <p className="text-gray-500 mt-1">
            {orders?.length || 0} pedidos
            {status ? ` con estado "${status}"` : ""}
          </p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={
              f.value ? `/dashboard/orders?status=${f.value}` : "/dashboard/orders"
            }
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
              status === f.value || (!status && !f.value)
                ? "gradient-brand text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Orders list */}
      {!orders || orders.length === 0 ? (
        <div className="card-flat p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-9 h-9 text-gray-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
            Sin pedidos{status ? ` con estado "${status}"` : ""}
          </h3>
          <p className="text-gray-400">
            Los pedidos de tus clientes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <div className="divide-y divide-gray-50">
            {(orders as Order[]).map((order) => (
              <div
                key={order.id}
                className="p-5 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {order.customer_name}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        📞 {order.customer_phone}
                        {order.customer_address &&
                          ` • 📍 ${order.customer_address}`}
                      </p>

                      {/* Items */}
                      <div className="mt-3 space-y-1">
                        {(order.items as { product_name: string; quantity: number; unit_price: number; variant_label?: string }[]).map((item, i) => (
                          <div
                            key={i}
                            className="text-sm text-gray-600 flex items-center gap-2"
                          >
                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0">
                              {item.quantity}
                            </span>
                            <span className="truncate">
                              {item.product_name}
                              {item.variant_label && (
                                <span className="text-gray-400">
                                  {" "}
                                  ({item.variant_label})
                                </span>
                              )}
                            </span>
                            <span className="ml-auto font-medium text-gray-700 whitespace-nowrap">
                              {formatCurrency(item.unit_price * item.quantity, currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer_notes && (
                        <p className="mt-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                          💬 {order.customer_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-black text-xl text-gray-900">
                      {formatCurrency(order.total, currency)}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
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
        </div>
      )}
    </div>
  );
}
