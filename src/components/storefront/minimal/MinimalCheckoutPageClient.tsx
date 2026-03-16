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

interface MinimalCheckoutPageClientProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
  primaryColor: string;
}

export default function MinimalCheckoutPageClient({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  primaryColor,
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
  } = useCheckoutLogic({ storeId, storeSlug, whatsappNumber, currency });

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
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+595 XXX XXXXXX"
                    className="w-full border-b border-gray-200 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
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

                <div className="space-y-2">
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

            <div className="border-t border-gray-200 pt-8 mt-8">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total</span>
                <span className="text-2xl font-medium text-gray-900">
                  {formatCurrency(total, currency)}
                </span>
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
