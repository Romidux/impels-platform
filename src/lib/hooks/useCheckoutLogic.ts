"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppMessage, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface UseCheckoutLogicProps {
  storeId: string;
  storeSlug: string;
  whatsappNumber?: string;
  currency: string;
  storeName?: string;
}

export function useCheckoutLogic({
  storeId,
  storeSlug,
  whatsappNumber,
  currency,
  storeName,
}: UseCheckoutLogicProps) {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const subtotal = getTotalPrice();
  
  const [discountAmount, setDiscountAmount] = useState(0);
  const total = Math.max(0, subtotal - discountAmount);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    payment_method: "",
    shipping_method: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");

    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("validate_coupon_public", {
        p_store_id: storeId,
        p_code: couponCode.trim().toUpperCase(),
        p_subtotal: subtotal,
      });

      if (error) throw new Error("Error interno al validar cupón");
      
      const res = data as { valid: boolean, code?: string, type?: string, calculated_discount?: number, message: string, min_purchase?: number };

      if (!res.valid) {
        if (res.message === 'minimum_not_met' && res.min_purchase) {
          throw new Error(`El mínimo de compra es ${formatCurrency(res.min_purchase, currency)}`);
        }
        throw new Error(res.message || "Cupón inválido");
      }

      setDiscountAmount(res.calculated_discount || 0);
      setAppliedCoupon({ code: res.code!, type: res.type!, value: 0 }); // El valor exacto real no importa a la UI ahora, solo el descuento calculado
      setCouponError(res.message);
    } catch (err: any) {
      setCouponError(err.message || "Cupón inválido");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError("");
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
          p_subtotal: subtotal,
          p_total: total,
          p_payment_method: form.payment_method || null,
          p_shipping_method: form.shipping_method || null,
          p_coupon_code: appliedCoupon ? appliedCoupon.code : null,
        }
      );

      if (error) throw error;

      if (whatsappNumber) {
        const message = buildWhatsAppMessage(items, form, subtotal, discountAmount, total, currency, appliedCoupon?.code, orderId, storeName);
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
    subtotal,
    discountAmount,
    total,
    form,
    submitting,
    submitted,
    mounted,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    validatingCoupon,
    handleApplyCoupon,
    removeCoupon,
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
