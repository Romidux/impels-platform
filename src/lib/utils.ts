import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  orderId?: string
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

  const message = `¡Hola! Quiero confirmar mi pedido 👋

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
