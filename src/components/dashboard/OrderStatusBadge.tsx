import { OrderStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; classes: string }
> = {
  new: { label: "Nuevo", classes: "bg-blue-50 text-blue-800" },
  confirmed: { label: "Confirmado", classes: "bg-brand-50 text-brand-900" },
  processing: { label: "En proceso", classes: "bg-amber-50 text-amber-800" },
  delivered: { label: "Entregado", classes: "bg-emerald-50 text-emerald-800" },
  cancelled: { label: "Cancelado", classes: "bg-red-50 text-red-800" },
};

export default function OrderStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
