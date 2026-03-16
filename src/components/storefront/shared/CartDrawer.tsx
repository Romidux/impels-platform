"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, MessageCircle, Plus, Minus, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Store, StoreSettings, CartItem } from "@/lib/types";
import { formatCurrency, buildWhatsAppMessage } from "@/lib/utils";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  settings?: StoreSettings;
}

export default function CartDrawer({
  isOpen,
  onClose,
  store,
  settings,
}: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const total = getTotalPrice();
  const currency = settings?.currency || "Gs";

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCheckout = () => {
    if (!settings?.whatsapp_number) {
      alert(
        "Esta tienda no tiene WhatsApp configurado. Contacta al vendedor directamente."
      );
      return;
    }
    // We'll redirect to a checkout page instead
    window.location.href = `/store/${store.slug}/checkout`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-gray-900">
                    Tu carrito
                  </h2>
                  <p className="text-xs text-gray-400">
                    {items.length} {items.length === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="w-9 h-9 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Tu carrito está vacío
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Agrega productos para comenzar tu pedido
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ver catálogo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item: CartItem) => (
                    <div
                      key={`${item.product_id}-${item.variant_combination_id}`}
                      className="flex gap-4 bg-gray-50 rounded-2xl p-3"
                    >
                      {/* Image */}
                      <div className="w-18 h-18 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 w-16 h-16">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {item.product_name}
                        </p>
                        {item.variant_label && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.variant_label}
                          </p>
                        )}
                        <p className="text-sm font-bold text-blue-600 mt-1">
                          {formatCurrency(item.price, currency)}
                        </p>

                        {/* Quantity */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity - 1,
                                item.variant_combination_id
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-blue-400 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity + 1,
                                item.variant_combination_id
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-blue-400 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              removeItem(
                                item.product_id,
                                item.variant_combination_id
                              )
                            }
                            className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-display text-2xl font-black text-gray-900">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
                <Link
                  href={`/store/${store.slug}/checkout`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Hacer pedido por WhatsApp
                </Link>
                <button
                  onClick={() => {
                    clearCart();
                  }}
                  className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
