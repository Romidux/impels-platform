import { OrderStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; classes: string }
> = {
  new: { label: "Nuevo", classes: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmado", classes: "bg-indigo-100 text-indigo-700" },
  processing: { label: "En proceso", classes: "bg-yellow-100 text-yellow-700" },
  delivered: { label: "Entregado", classes: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", classes: "bg-red-100 text-red-700" },
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
