import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import Link from "next/link";
import { ShoppingCart, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/lib/types";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import OrderStatusChanger from "@/components/dashboard/OrderStatusChanger";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const store = await getStore(user.id);
  if (!store) redirect("/onboarding");

  const supabase = await createClient();

  const params = await searchParams;
  const { status } = params;
  const page = parseInt(params.page || "1");
  const pageSize = status ? 20 : 50; // Increase page size for the Kanban board view

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
      <PageHeader
        title="Pedidos"
        subtitle={`${totalCount || 0} pedidos${status ? ` con estado "${status}"` : ""}`}
        actions={
          <Button asChild variant="secondary" icon={<Download className="w-4 h-4" />}>
            <a href="/api/export?type=orders" download>
              Exportar CSV
            </a>
          </Button>
        }
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
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Orders list / Pipeline */}
      {!orders || orders.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8" />}
            heading={`Sin pedidos${status ? ` con estado "${status}"` : ""}`}
            description="Los pedidos de tus clientes aparecerán aquí."
          />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className={`flex gap-4 ${status ? "flex-col lg:flex-row" : "flex-col lg:flex-row min-w-[1000px]"}`}>
            {statusFilters
              .filter(f => !status || f.value === status) // If filtered, show only that column or list
              .filter(f => f.value !== "") // Exclude "Todos" from being a column
              .map((col) => {
                const columnOrders = (orders as Order[]).filter((o) => o.status === col.value);
                
                // Hide empty columns on mobile if we are in "Todos" mode, but show on desktop pipeline
                if (columnOrders.length === 0 && !status) {
                  return (
                    <div key={col.value} className="hidden lg:flex flex-col w-full min-w-[300px] bg-[#F2F4F6] rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-semibold text-slate-700 text-sm">{col.label}</h3>
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">0</span>
                      </div>
                      <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center py-10">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Vacio</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={col.value} className="flex flex-col flex-1 w-full lg:min-w-[320px] bg-transparent lg:bg-[#F2F4F6] lg:p-3 lg:rounded-2xl gap-3">
                    <div className="hidden lg:flex items-center justify-between mb-1 px-1">
                      <h3 className="font-semibold text-slate-600 text-sm">{col.label}</h3>
                      <span className="text-xs font-bold text-slate-600 bg-white shadow-sm border border-slate-200 px-2 py-0.5 rounded-full">
                        {columnOrders.length}
                      </span>
                    </div>
                    
                    {columnOrders.map((order) => {
                      const whatsappLink = order.customer_phone
                        ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=Hola+${encodeURIComponent(order.customer_name)}+somos+${encodeURIComponent(store.name)},+les+escribimos+sobre+su+pedido.`
                        : null;

                      return (
                        <div key={order.id} className="dash-card flex flex-col p-4 hover:shadow-md transition-shadow gap-3 bg-white">
                          <Link href={`/dashboard/orders/${order.id}`} className="flex items-start justify-between group">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{order.customer_name}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display font-black text-lg text-slate-900 leading-none mb-1">
                                {formatCurrency(order.total, currency)}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.created_at).toLocaleString("es-PY", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </Link>

                          <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100">
                            {(order.items as { product_name: string; quantity: number; variant_label?: string }[]).map((item, i) => (
                              <div key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="font-bold text-brand-600">{item.quantity}x</span>
                                <span className="truncate flex-1">
                                  {item.product_name}
                                  {item.variant_label && <span className="text-slate-400 ml-1">({item.variant_label})</span>}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100 gap-2">
                            {whatsappLink ? (
                              <Button asChild variant="secondary" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
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
                            <OrderStatusChanger orderId={order.id} currentStatus={order.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dash-card mt-4 flex items-center justify-between px-5 py-3 text-sm text-slate-500">
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
