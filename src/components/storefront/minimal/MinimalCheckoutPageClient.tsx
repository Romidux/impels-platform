"use client";

import { useCheckoutLogic } from "@/lib/hooks/useCheckoutLogic";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeft, 
  Check, 
  ShoppingBag,
  User,
  Phone,
  MapPin,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useEffect } from "react";

interface MinimalCheckoutPageClientProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
  primaryColor: string;
  paymentMethods: string[];
  shippingMethods: string[];
}

export default function MinimalCheckoutPageClient({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  primaryColor,
  paymentMethods,
  shippingMethods,
}: MinimalCheckoutPageClientProps) {
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

  // Auto-select when only one option is available
  useEffect(() => {
    if (shippingMethods.length === 1) handleChange("shipping_method", shippingMethods[0]);
    if (paymentMethods.length === 1) handleChange("payment_method", paymentMethods[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-white">
        <AnimatePresence mode="wait">
          <motion.div 
            key="checkout-success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-lg"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl"
            >
              <Check className="w-10 h-10" />
            </motion.div>
            
            <h1 className="text-4xl font-medium tracking-tight text-gray-900 mb-4">
              Pedido enviado
            </h1>
            
            <p className="text-gray-500 text-lg font-light leading-relaxed mb-12 px-6">
              Tu pedido fue registrado correctamente. 
              <br />
              Continuaremos la atención por WhatsApp.
            </p>
            
            <Link
              href={`/store/${storeSlug}`}
              onClick={() => clearSuccessSession()}
              className="inline-block px-12 py-4 bg-black text-white text-sm font-medium tracking-widest uppercase hover:bg-gray-900 transition-all shadow-sm"
            >
              Seguir comprando
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Header/Back Link */}
        <div className="py-12 border-b border-gray-100 mb-12 flex items-center justify-between">
          <Link
            href={`/store/${storeSlug}/catalog`}
            onClick={() => clearSuccessSession()}
            className="group flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Volver
          </Link>
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Finalizar Pedido
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
          {/* Left: Form */}
          <div className="space-y-12">
            <section className="space-y-8">
              <h2 className="text-2xl font-medium tracking-tight text-gray-900">Tus Datos</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Nombre Completo *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Escribe tu nombre"
                    className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Teléfono / WhatsApp *</label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(val) => handleChange("phone", val)}
                    placeholder="981 234 567"
                    className=""
                    inputClassName="flex-1 w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 border-t-0 border-l-0 border-r-0 rounded-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email (Opcional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Dirección de Entrega</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Calle, ciudad..."
                    rows={2}
                    className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  {/* Shipping method */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                      Método de Envío / Retiro {shippingMethods.length > 0 && "*"}
                    </label>
                    {shippingMethods.length === 0 ? (
                      <p className="py-3 border-b border-gray-200 text-sm text-gray-400 italic">
                        A coordinar por chat
                      </p>
                    ) : shippingMethods.length === 1 ? (
                      <p className="py-3 border-b border-gray-200 text-sm text-gray-900">
                        {shippingMethods[0]}
                      </p>
                    ) : (
                      <select
                        value={form.shipping_method}
                        onChange={(e) => handleChange("shipping_method", e.target.value)}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent cursor-pointer"
                        required
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {shippingMethods.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Payment method */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                      Método de Pago {paymentMethods.length > 0 && "*"}
                    </label>
                    {paymentMethods.length === 0 ? (
                      <p className="py-3 border-b border-gray-200 text-sm text-gray-400 italic">
                        A coordinar por chat
                      </p>
                    ) : paymentMethods.length === 1 ? (
                      <p className="py-3 border-b border-gray-200 text-sm text-gray-900">
                        {paymentMethods[0]}
                      </p>
                    ) : (
                      <select
                        value={form.payment_method}
                        onChange={(e) => handleChange("payment_method", e.target.value)}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-transparent cursor-pointer"
                        required
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {paymentMethods.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Notas Adicionales</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Ej. Tocar el timbre, dejar en portería..."
                    rows={2}
                    className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 resize-none"
                  />
                </div>
              </div>
            </section>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-5 bg-black text-white text-sm font-medium tracking-widest uppercase hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {submitting ? "Procesando..." : "Confirmar por WhatsApp"}
            </button>
          </div>

          {/* Right: Summary */}
          <div className="lg:sticky lg:top-8 h-fit bg-gray-50 p-8 sm:p-12">
            <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-8 border-b border-gray-100 pb-8">Resumen</h2>
            
            <div className="space-y-6 mb-12 max-h-[40vh] overflow-y-auto no-scrollbar">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant_combination_id}`} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 leading-tight mb-1">{item.product_name}</h4>
                    {item.variant_label && (
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{item.variant_label}</p>
                    )}
                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-8 mt-8 space-y-6">
              
              {/* Cupón */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">¿Tienes un cupón?</label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black uppercase transition-all"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-6 py-2 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {validatingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">{appliedCoupon.code}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-[10px] text-gray-500 hover:text-black underline uppercase tracking-widest font-bold">
                      Quitar
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className={`text-[10px] tracking-wide uppercase font-medium ${appliedCoupon ? 'text-green-600' : 'text-red-500'}`}>
                    {couponError}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Descuento ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount, currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total</span>
                  <span className="text-2xl font-medium text-gray-900">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-12 text-[10px] text-gray-400 leading-relaxed uppercase tracking-widest text-center">
              Tu pedido será confirmado vía WhatsApp para coordinar el pago y envío.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
