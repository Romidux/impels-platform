"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toggleStoreActive } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Power, Loader2, X, AlertTriangle } from "lucide-react";

export function ToggleStoreButton({
  storeId,
  isActive,
  disabledReason,
}: {
  storeId: string;
  isActive: boolean;
  disabledReason?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setReason("");
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen && !isPending) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen, isPending]);

  const handleClick = () => {
    if (isActive) {
      // Suspending → show modal to enter reason
      setIsModalOpen(true);
    } else {
      // Reactivating → confirm directly
      if (!confirm(`¿Reactivar esta tienda?`)) return;
      execute(true, undefined);
    }
  };

  const handleSuspend = () => {
    execute(false, reason.trim() || undefined);
    setIsModalOpen(false);
  };

  const execute = (newActive: boolean, suspendReason?: string) => {
    startTransition(async () => {
      const result = await toggleStoreActive(storeId, newActive, suspendReason);
      if (result.success) {
        toast.success(newActive ? "Tienda reactivada" : "Tienda suspendida");
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  return (
    <>
      <button
        onClick={handleClick}
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

      {/* Suspension reason modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isPending && setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-amber-900">Suspender tienda</h2>
                  <p className="text-sm text-amber-700/80 mt-0.5">
                    La tienda dejará de ser pública hasta que la reactives.
                  </p>
                </div>
                {!isPending && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-amber-400 hover:text-amber-600 transition-colors p-1 -mt-1 -mr-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {disabledReason && (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="font-semibold text-slate-700">Motivo anterior:</span>{" "}
                  {disabledReason}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Motivo de suspensión <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Pago vencido, violación de términos..."
                  disabled={isPending}
                  onKeyDown={(e) => e.key === "Enter" && handleSuspend()}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all disabled:opacity-50"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Queda registrado en el historial de la tienda.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                Suspender tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
