"use client";

import { useState, useTransition } from "react";
import { toggleStoreActive } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Power, Loader2 } from "lucide-react";

export function ToggleStoreButton({
  storeId,
  isActive,
}: {
  storeId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = isActive ? "suspender" : "reactivar";
    if (!confirm(`¿Estás segura de que quieres ${action} esta tienda?`)) return;

    startTransition(async () => {
      const result = await toggleStoreActive(storeId, !isActive);
      if (result.success) {
        toast.success(
          isActive ? "Tienda suspendida" : "Tienda reactivada"
        );
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50",
        isActive
          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Power className="w-4 h-4" />
      )}
      {isActive ? "Suspender tienda" : "Reactivar tienda"}
    </button>
  );
}
