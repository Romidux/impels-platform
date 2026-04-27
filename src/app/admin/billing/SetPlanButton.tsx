"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setStorePlan } from "./actions";

interface SetPlanButtonProps {
  storeId: string;
  currentPlan: "free" | "pro";
  storeName: string;
}

export function SetPlanButton({ storeId, currentPlan, storeName }: SetPlanButtonProps) {
  const [loading, setLoading] = useState(false);

  const targetPlan = currentPlan === "free" ? "pro" : "free";
  const label = currentPlan === "free" ? "Activar Pro" : "Bajar a Free";
  const variant =
    currentPlan === "free"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-slate-100 hover:bg-slate-200 text-slate-700";

  const handleClick = async () => {
    const confirmed = window.confirm(
      currentPlan === "free"
        ? `¿Activar plan Pro para "${storeName}"?`
        : `¿Bajar a plan Free a "${storeName}"? Perderá acceso a funciones Pro.`
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await setStorePlan(storeId, targetPlan);
    setLoading(false);

    if (result.success) {
      toast.success(
        currentPlan === "free"
          ? `Plan Pro activado para ${storeName}`
          : `${storeName} bajado a plan Free`
      );
    } else {
      toast.error(result.error ?? "Error al cambiar el plan");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${variant}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
