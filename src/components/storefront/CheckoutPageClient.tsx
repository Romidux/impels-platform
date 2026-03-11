"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  MessageSquare,
  MessageCircle,
  ShoppingBag,
  CheckCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatCurrency, buildWhatsAppMessage } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CheckoutPageClientProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
  primaryColor: string;
}

export default function CheckoutPageClient({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  primaryColor,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const total = getTotalPrice();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (items.length === 0 && !submitted) {
    router.push(`/store/${storeSlug}`);
    return null;
  }

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Nombre y teléfono son requeridos");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      // Create order in database
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_address: form.address,
          customer_notes: form.notes,
          items: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            variant_label: item.variant_label,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          })),
          subtotal: total,
          total,
          status: "new",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Build WhatsApp message
      if (whatsappNumber) {
        const message = buildWhatsAppMessage(items, form, total, currency);
        window.open(
          `https://wa.me/${whatsappNumber}?text=${message}`,
          "_blank"
        );
      }

      setSubmitted(true);
      clearCart();
      toast.success("Pedido enviado exitosamente");
    } catch {
      toast.error("Error al procesar el pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <CheckCircle
              className="w-10 h-10"
              style={{ color: primaryColor }}
            />
          </div>
          <h1 className="font-display text-3xl font-black text-gray-900 mb-3">
            ¡Pedido enviado! 🎉
          </h1>
          <p className="text-gray-500 mb-8">
            Tu pedido fue registrado y el mensaje de WhatsApp fue abierto. El
            vendedor se pondrá en contacto contigo a la brevedad.
          </p>
          <Link
            href={`/store/${storeSlug}`}
            className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-2xl text-white transition-all hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-5 h-5" />
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/store/${storeSlug}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la tienda
      </Link>

      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
        Finalizar pedido
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-display font-bold text-gray-900 text-lg">
              Tus datos
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre completo *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Teléfono / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+595 XXX XXXXXX"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Dirección de entrega
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Calle, número, ciudad..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notas del pedido (opcional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Alguna indicación especial..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 shadow-lg"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-6 h-6" />
                Confirmar pedido por WhatsApp
              </>
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 h-fit">
          <h2 className="font-display font-bold text-gray-900 text-lg">
            Resumen del pedido
          </h2>

          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.variant_combination_id}`}
                className="flex gap-3 py-3"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {item.product_name}
                  </p>
                  {item.variant_label && (
                    <p className="text-xs text-gray-400">{item.variant_label}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    x{item.quantity}
                  </p>
                </div>
                <p className="font-bold text-sm text-gray-900 whitespace-nowrap">
                  {formatCurrency(item.price * item.quantity, currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total</span>
              <span
                className="font-display font-black text-2xl"
                style={{ color: primaryColor }}
              >
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
            <p className="font-semibold text-gray-500 mb-1">
              ℹ️ Cómo funciona el pedido
            </p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Completa tus datos</li>
              <li>Hacemos click en &ldquo;Confirmar&rdquo;</li>
              <li>Se abre WhatsApp con tu pedido listo</li>
              <li>El vendedor confirma y coordina la entrega</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
