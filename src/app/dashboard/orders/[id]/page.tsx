import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  StickyNote,
  Package,
  Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem, OrderStatus } from "@/lib/types";
import OrderStatusChanger from "@/components/dashboard/OrderStatusChanger";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

const STATUS_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "new", label: "Nuevo" },
  { status: "confirmed", label: "Confirmado" },
  { status: "processing", label: "En proceso" },
  { status: "delivered", label: "Entregado" },
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .single();

  if (!order) notFound();

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;
  const currency = settings?.currency || "Gs";
  const items = (order.items || []) as OrderItem[];

  const whatsappLink = order.customer_phone
    ? `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=Hola+${encodeURIComponent(order.customer_name)}+somos+${encodeURIComponent(store.name)},+tu+pedido+%23${order.id.slice(0, 8).toUpperCase()}+está+siendo+procesado.`
    : null;

  const statusIndex = STATUS_TIMELINE.findIndex(
    (s) => s.status === order.status
  );
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
        subtitle={`Creado el ${new Date(order.created_at).toLocaleString("es-PY", {
          dateStyle: "long",
          timeStyle: "short",
        })}`}
        backHref="/dashboard/orders"
      />

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="dash-card px-5 py-4">
          <div className="flex items-center">
            {STATUS_TIMELINE.map((step, i) => {
              const isCompleted = i <= statusIndex;
              const isCurrent = i === statusIndex;
              return (
                <div key={step.status} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-1 relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      } ${isCurrent ? "ring-4 ring-brand-100 scale-110" : ""}`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCompleted ? "text-brand-600" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_TIMELINE.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition-all mb-4 ${
                        i < statusIndex ? "bg-brand-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="dash-card p-4 bg-red-50 border-red-200">
          <p className="text-sm font-semibold text-red-700">
            ❌ Este pedido fue cancelado
          </p>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Order items & totals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="dash-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-600" />
              <h3 className="font-semibold text-sm text-slate-900">
                Productos ({items.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.product_name}
                    </p>
                    {item.variant_label && (
                      <p className="text-xs text-slate-500">
                        {item.variant_label}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrency(item.unit_price, currency)} × {item.quantity}
                    </p>
                  </div>
                  {/* Total */}
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(item.unit_price * item.quantity, currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 px-5 py-4 space-y-2 bg-slate-50/30">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, currency)}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Descuento {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                  <span>-{formatCurrency(order.discount_amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-lg">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.customer_notes && (
            <div className="dash-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Notas del cliente
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                {order.customer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Status changer — first so it's always visible */}
          <div className="dash-card p-5 space-y-3 border-2 border-brand-100">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Cambiar estado
            </h3>
            <OrderStatusChanger
              orderId={order.id}
              currentStatus={order.status as OrderStatus}
            />
          </div>

          {/* Customer info */}
          <div className="dash-card p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              Cliente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700 font-medium">
                  {order.customer_name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 truncate">
                    {order.customer_email}
                  </span>
                </div>
              )}
              {order.customer_address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    {order.customer_address}
                  </span>
                </div>
              )}
              {order.shipping_method && (
                <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-100 text-sm">
                  <Package className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-500 block uppercase tracking-wider font-bold">Entrega</span>
                    <span className="text-slate-800 font-medium">
                      {order.shipping_method}
                    </span>
                  </div>
                </div>
              )}
              {order.payment_method && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-4 h-4 text-brand-600 flex-shrink-0 flex items-center justify-center font-bold">₲</div>
                  <div>
                    <span className="text-xs text-slate-500 block uppercase tracking-wider font-bold">Pago</span>
                    <span className="text-slate-800 font-medium">
                      {order.payment_method}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp action */}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-semibold transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>
            )}
          </div>

          {/* Order metadata */}
          <div className="dash-card p-5 space-y-3">
            <h3 className="font-semibold text-sm text-slate-900">
              Información
            </h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>ID Pedido</span>
                <span className="font-mono text-slate-700">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Creado</span>
                <span className="text-slate-700">
                  {new Date(order.created_at).toLocaleString("es-PY", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Actualizado</span>
                <span className="text-slate-700">
                  {new Date(order.updated_at).toLocaleString("es-PY", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
