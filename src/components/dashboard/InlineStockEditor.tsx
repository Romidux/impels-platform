"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check, X, Minus, Plus } from "lucide-react";

export default function InlineStockEditor({
  productId,
  currentStock,
}: {
  productId: string;
  currentStock: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentStock);
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    if (value === currentStock) {
      setEditing(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: value })
        .eq("id", productId);

      if (error) throw error;

      toast.success(`Stock actualizado a ${value}`);
      setEditing(false);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Error al actualizar stock");
      setValue(currentStock);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setValue(currentStock);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 cursor-pointer"
        title="Click para editar stock"
      >
        <span
          className={`text-sm font-bold tabular-nums ${
            currentStock <= 0
              ? "text-red-600"
              : currentStock <= 5
              ? "text-amber-600"
              : "text-slate-900"
          }`}
        >
          {currentStock}
        </span>
        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          editar
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setValue(Math.max(0, value - 1))}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
      >
        <Minus className="w-3 h-3 text-slate-600" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))}
        onKeyDown={handleKeyDown}
        autoFocus
        min={0}
        className="w-14 h-7 text-center text-sm font-bold border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white"
      />
      <button
        onClick={() => setValue(value + 1)}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
      >
        <Plus className="w-3 h-3 text-slate-600" />
      </button>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-6 h-6 rounded-md bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors disabled:opacity-50"
      >
        <Check className="w-3 h-3 text-green-700" />
      </button>
      <button
        onClick={() => {
          setValue(currentStock);
          setEditing(false);
        }}
        className="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
      >
        <X className="w-3 h-3 text-red-500" />
      </button>
    </div>
  );
}
