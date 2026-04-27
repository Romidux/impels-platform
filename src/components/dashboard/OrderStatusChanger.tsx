"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; pill: string; dot: string }
> = {
  new: {
    label: "Nuevo",
    pill: "bg-blue-50 text-blue-800 border-blue-200/60 hover:bg-blue-100",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmado",
    pill: "bg-brand-50 text-brand-900 border-brand-200/60 hover:bg-brand-100",
    dot: "bg-brand-500",
  },
  processing: {
    label: "En proceso",
    pill: "bg-amber-50 text-amber-800 border-amber-200/60 hover:bg-amber-100",
    dot: "bg-amber-500",
  },
  delivered: {
    label: "Entregado",
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelado",
    pill: "bg-red-50 text-red-800 border-red-200/60 hover:bg-red-100",
    dot: "bg-red-500",
  },
};

const ALL_STATUSES = Object.entries(STATUS_CONFIG) as [
  OrderStatus,
  (typeof STATUS_CONFIG)[OrderStatus],
][];

export default function OrderStatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = async (newStatus: OrderStatus) => {
    if (newStatus === value) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
      setValue(newStatus);
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const config = STATUS_CONFIG[value];

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => !loading && setOpen(!open)}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border",
          config.pill,
          loading && "opacity-60 cursor-not-allowed"
        )}
      >
        {config.label}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_24px_rgba(0,0,0,0.10)] z-50 min-w-[148px] py-1.5">
          {ALL_STATUSES.map(([status, cfg]) => (
            <button
              key={status}
              type="button"
              onClick={() => handleChange(status)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    cfg.dot
                  )}
                />
                {cfg.label}
              </span>
              {status === value && (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
