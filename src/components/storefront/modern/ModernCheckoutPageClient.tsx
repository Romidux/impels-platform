"use client";

import { useCheckoutLogic } from "@/lib/hooks/useCheckoutLogic";
import { formatCurrency } from "@/lib/utils";
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
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface CheckoutPageClientProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
  primaryColor: string;
  paymentMethods: string[];
  shippingMethods: string[];
}

export default function CheckoutPageClient({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  primaryColor,
  paymentMethods,
  shippingMethods,
}: CheckoutPageClientProps) {
  const {
    items,
    total,
    form,
    submitting,
    submitted,
    mounted,
    handleChange,
    handleSubmit,
    clearSuccessSession,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    validatingCoupon,
    handleApplyCoupon,
    removeCoupon,
    subtotal,
    discountAmount
  } = useCheckoutLogic({ storeId, storeSlug, whatsappNumber, currency });

  if (!mounted) return null;

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key="modern-checkout-success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle
                className="w-10 h-10"
                style={{ color: primaryColor }}
              />
            </motion.div>
            <h1 className="font-display text-3xl font-black text-gray-900 mb-3">
              ¡Pedido enviado! 🎉
            </h1>
            <p className="text-gray-500 mb-8">
              Tu pedido fue registrado y el mensaje de WhatsApp fue abierto. El
              vendedor se pondrá en contacto contigo a la brevedad.
            </p>
            <Link
              href={`/store/${storeSlug}`}
              onClick={() => clearSuccessSession()}
              className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-2xl text-white transition-all hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingBag className="w-5 h-5" />
              Seguir comprando
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/store/${storeSlug}`}
        onClick={() => clearSuccessSession()}
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
              <PhoneInput
                value={form.phone}
                onChange={(val) => handleChange("phone", val)}
                placeholder="981 234 567"
                inputClassName="flex-1 w-full border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email (opcional)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
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
                Método de Envío / Retiro *
              </label>
              <div className="relative">
                <select
                  value={form.shipping_method}
                  onChange={(e) => handleChange("shipping_method", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all cursor-pointer bg-white"
                  required
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {shippingMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Método de Pago *
              </label>
              <div className="relative">
                <select
                  value={form.payment_method}
                  onChange={(e) => handleChange("payment_method", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all cursor-pointer bg-white"
                  required
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
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

            <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
              
              {/* Cupón */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">¿Tienes un cupón?</label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 uppercase transition-all"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {validatingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-bold">{appliedCoupon.code}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-xs text-green-600 hover:text-green-800 underline uppercase tracking-widest font-semibold">
                      Quitar
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className={`text-xs ml-1 ${appliedCoupon ? 'text-green-600' : 'text-red-500'}`}>
                    {couponError}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                      <span>Descuento ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount, currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-gray-900">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
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
