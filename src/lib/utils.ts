import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 🛒 CENTRALIZADOR DE STOCK (ÚNICA FUENTE DE VERDAD)
// ============================================================================
export function checkIsOutOfStock(product: Product): boolean {
  if (!product.track_inventory) {
    return false; // Inventario infinito
  }
  
  if (product.allow_backorder) {
    return false; // Se puede seguir vendiendo aunque sea < 0
  }

  if (product.has_variants && product.manage_stock_by_variant) {
    // Si tiene variantes y maneja stock por variante, asumimos OOS si TODOS los seleccionables son <= 0
    const totalVariantStock = product.variant_combinations?.reduce((acc, vc) => acc + (vc.stock || 0), 0) || 0;
    return totalVariantStock <= 0;
  }

  // Stock base del producto simple
  return (product.stock_quantity || 0) <= 0;
}

export function formatCurrency(
  amount: number,
  currency: string = "Gs"
): string {
  if (currency === "Gs" || currency === "PYG") {
    return `${amount.toLocaleString("es-PY")} Gs`;
  }
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function buildWhatsAppMessage(
  items: CartItem[],
  customer: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
    payment_method?: string;
    shipping_method?: string;
  },
  subtotal: number,
  discountAmount: number,
  total: number,
  currency: string = "Gs",
  couponCode?: string,
  orderId?: string,
  storeName?: string
): string {
  const itemLines = items
    .map(
      (item) =>
        `▪️ ${item.quantity}x ${item.product_name}${item.variant_label ? ` (${item.variant_label})` : ""} - ${formatCurrency(item.price * item.quantity, currency)}`
    )
    .join("\n");

  const orderLine = orderId ? `*Pedido:* #${orderId.split("-")[1] || orderId.substring(0,8)}` : `*Nuevo Pedido*`;

  const discountLine = discountAmount > 0
    ? `\nDescuento ${couponCode ? `(${couponCode})` : ""}: -${formatCurrency(discountAmount, currency)}`
    : "";

  const financeLines = discountAmount > 0
    ? `Subtotal: ${formatCurrency(subtotal, currency)}${discountLine}\n*Total a pagar: ${formatCurrency(total, currency)}*`
    : `*Total a pagar: ${formatCurrency(total, currency)}*`;

  const greeting = storeName
    ? `¡Hola! Soy ${customer.name} desde *${storeName}* 👋`
    : `¡Hola! Soy ${customer.name}, quiero confirmar mi pedido 👋`;

  const message = `${greeting}

${orderLine}

*Detalle:*
${itemLines}

${financeLines}

*Datos de entrega y pago:*
👤 ${customer.name}
📞 ${customer.phone}
📍 ${customer.address || "No especificada"}${customer.notes ? `\n📝 Notas: ${customer.notes}` : ""}
💳 Pago: ${customer.payment_method || "A coordinar"}
🚚 Envío a través de: ${customer.shipping_method || "A coordinar"}`;

  return encodeURIComponent(message);
}

export function getStoreUrl(slug: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/store/${slug}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
