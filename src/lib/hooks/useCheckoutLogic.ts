"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppMessage } from "@/lib/utils";
import { toast } from "sonner";

interface UseCheckoutLogicProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
}

export function useCheckoutLogic({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
}: UseCheckoutLogicProps) {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const total = getTotalPrice();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const SESSION_KEY = `checkout_success_${storeSlug}`;

  const clearSuccessSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSubmitted(false);
  }, [SESSION_KEY]);

  useEffect(() => {
    setMounted(true);

    // Persistence check
    const sessionSuccess = sessionStorage.getItem(SESSION_KEY);
    if (sessionSuccess) {
      const timestamp = parseInt(sessionSuccess, 10);
      const now = Date.now();
      if (now - timestamp < 5 * 60 * 1000) { // 5 minutes
        setSubmitted(true);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [SESSION_KEY]);

  // Handle redirection safely in useEffect to avoid the "Cannot update a component while rendering" error
  useEffect(() => {
    if (!mounted) return;
    
    const sessionSuccess = sessionStorage.getItem(SESSION_KEY);
    if (items.length === 0 && !submitted && !sessionSuccess) {
      router.push(`/store/${storeSlug}`);
    }
  }, [mounted, items.length, submitted, storeSlug, router, SESSION_KEY]);

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
      const { data: orderId, error } = await supabase.rpc(
        "create_order_and_deduct_stock",
        {
          p_store_id: storeId,
          p_customer_name: form.name,
          p_customer_phone: form.phone,
          p_customer_email: form.email,
          p_customer_address: form.address,
          p_customer_notes: form.notes,
          p_items: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            variant_combination_id: item.variant_combination_id || null,
            variant_label: item.variant_label || null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          })),
          p_subtotal: total,
          p_total: total,
        }
      );

      if (error) throw error;

      if (whatsappNumber) {
        const message = buildWhatsAppMessage(items, form, total, currency);
        window.open(
          `https://wa.me/${whatsappNumber}?text=${message}`,
          "_blank"
        );
      }

      // Persist success state
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      setSubmitted(true);
      clearCart();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    items,
    total,
    form,
    submitting,
    submitted,
    mounted,
    handleChange,
    handleSubmit,
    clearSuccessSession,
    router,
  };
}

export const clearCheckoutSuccess = (storeSlug: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(`checkout_success_${storeSlug}`);
  }
};
