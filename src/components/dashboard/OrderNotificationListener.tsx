"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BellRing, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function OrderNotificationListener({ storeId }: { storeId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("store-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newOrder = payload.new;

          toast.success(
            <div className="flex flex-col gap-1.5 w-full pr-2">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <BellRing className="w-4 h-4 text-brand-600 animate-pulse" />
                ¡Nuevo pedido recibido!
              </div>
              <p className="text-xs text-gray-600">
                Cliente: <span className="font-semibold">{newOrder.customer_name}</span>
              </p>
              <div className="flex justify-between items-end mt-1">
                <span className="text-xs text-gray-500 font-mono">
                  #{newOrder.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  onClick={() => router.push(`/dashboard/orders/${newOrder.id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-1 rounded"
                >
                  Ver detalle <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>,
            { duration: 10000, style: { background: "white", padding: "16px" } }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, router]);

  return null; // pure logic component
}
