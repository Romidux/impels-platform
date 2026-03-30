"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteStoreComplete } from "../actions";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteStoreButtonProps {
  storeId: string;
  storeName: string;
}

export function DeleteStoreButton({ storeId, storeName }: DeleteStoreButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const expectedText = `ELIMINAR ${storeName}`;
  const isMatch = normalize(confirmText.trim()) === normalize(expectedText.trim());

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setConfirmText("");
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPending) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, isPending]);

  const handleDelete = () => {
    if (!isMatch || isPending) return;

    startTransition(async () => {
      const result = await deleteStoreComplete(storeId, confirmText);

      if (result.success) {
        // Report storage warnings if any
        if (result.storageErrors && result.storageErrors.length > 0) {
          toast.warning(
            `Tienda eliminada, pero hubo ${result.storageErrors.length} error(es) limpiando archivos de storage. Algunos archivos pueden quedar huérfanos.`,
            { duration: 8000 }
          );
        } else {
          toast.success("Tienda eliminada correctamente", {
            description: `"${storeName}" y todos sus datos han sido eliminados permanentemente.`,
          });
        }
        router.push("/admin/stores");
        router.refresh();
      } else {
        toast.error(`Error: ${result.error}`);
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
          "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
          "hover:border-red-300 hover:shadow-sm"
        )}
      >
        <Trash2 className="w-4 h-4" />
        Eliminar tienda
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            {/* Red danger header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-red-900">
                    Eliminar tienda permanentemente
                  </h2>
                  <p className="text-sm text-red-700/80 mt-1">
                    Esta acción es irreversible y no se puede deshacer.
                  </p>
                </div>
                {!isPending && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 -mt-1 -mr-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Se eliminarán <strong className="text-slate-900">permanentemente</strong>:
                </p>
                <ul className="text-sm text-slate-500 space-y-1.5 ml-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    Todos los productos y sus imágenes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    Categorías y variantes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    Todos los pedidos y clientes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    Configuraciones, branding y archivos de storage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    Miembros del equipo de la tienda
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Para confirmar, escribí{" "}
                  <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded tracking-wide">
                    ELIMINAR {storeName}
                  </span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`ELIMINAR ${storeName}`}
                  disabled={isPending}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none",
                    "focus:ring-2 focus:ring-red-200 focus:border-red-400",
                    isMatch
                      ? "border-red-300 bg-red-50/50 text-red-900 font-medium"
                      : "border-slate-200 bg-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "placeholder:text-slate-300"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isMatch) handleDelete();
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatch || isPending}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                  isMatch && !isPending
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
