"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { OrderStatus } from "@/lib/types";
import { ChevronDown } from "lucide-react";

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "confirmed", label: "Confirmado" },
  { value: "processing", label: "En proceso" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export default function OrderStatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mt-2">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={loading}
        className="appearance-none text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 pr-6 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white cursor-pointer disabled:opacity-50 transition-colors"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );
}
