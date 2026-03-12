"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Store, StoreSettings, CartItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface MinimalCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  settings?: StoreSettings;
}

export default function MinimalCartDrawer({
  isOpen,
  onClose,
  store,
  settings,
}: MinimalCartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } =
    useCartStore();
  const total = getTotalPrice();
  const currency = settings?.currency || "Gs";

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-black" />
                <h2 className="text-lg font-medium tracking-tight text-gray-900">
                  Tu Carrito
                </h2>
                <span className="text-gray-400 text-sm">({items.length})</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-black transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                  <ShoppingBag className="w-12 h-12 text-gray-200 stroke-[1.5]" />
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-gray-900">
                      Tu carrito está vacío
                    </p>
                    <p className="text-gray-500">
                      Explora nuestros productos y agrega algo.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item: CartItem) => (
                    <div
                      key={`${item.product_id}-${item.variant_combination_id}`}
                      className="flex gap-4 py-4 border-b border-gray-100 last:border-0"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 bg-gray-50 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      {/* Info & Controls */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 leading-tight">
                            {item.product_name}
                          </p>
                          {item.variant_label && (
                            <p className="text-sm text-gray-500">
                              {item.variant_label}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price, currency)}
                          </p>
                        </div>

                        {/* Controls Bottom Row */}
                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity */}
                          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  Math.max(1, item.quantity - 1),
                                  item.variant_combination_id
                                )
                              }
                              className="px-2.5 py-1.5 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
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
                              className="px-2.5 py-1.5 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Trash Icon */}
                          <button
                            onClick={() =>
                              removeItem(
                                item.product_id,
                                item.variant_combination_id
                              )
                            }
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-gray-100 bg-white space-y-4">
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900 tracking-tight">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
                
                <div className="space-y-3 pt-2">
                  <Link
                    href={`/store/${store.slug}/checkout`}
                    onClick={onClose}
                    className="flex items-center justify-center w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-full transition-colors tracking-wide text-sm"
                  >
                    Hacer pedido por WhatsApp
                  </Link>
                  <button
                    onClick={() => {
                      clearCart();
                    }}
                    className="w-full text-center text-sm text-gray-400 hover:text-gray-900 transition-colors py-2"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
