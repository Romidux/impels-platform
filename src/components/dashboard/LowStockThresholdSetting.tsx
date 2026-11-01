"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

/* El umbral de "stock bajo" vive acá, en Inventario, y no en la configuración
   de la tienda: es mirando esta pantalla cuando te das cuenta de que 5 no es tu
   número. El valor es por tienda y sale de `store_settings.low_stock_threshold`
   (migración 017). */
export default function LowStockThresholdSetting({
  storeId,
  value,
}: {
  storeId: string;
  value: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const abrir = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(value);
  };

  const handleSave = async () => {
    const limpio = Math.min(9999, Math.max(1, Math.round(draft) || 1));
    if (limpio === value) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("store_settings").upsert(
        { store_id: storeId, low_stock_threshold: limpio },
        { onConflict: "store_id" }
      );

      if (error) {
        /* La columna la agrega la migración 017. Si todavía no se aplicó, la
           base responde con un error de columna inexistente, que por sí solo no
           le dice nada a nadie. */
        const faltaColumna =
          error.message?.includes("low_stock_threshold") ||
          error.code === "42703";
        toast.error(
          faltaColumna
            ? "Falta aplicar la migración 017 en Supabase para poder guardar el umbral"
            : "No se pudo guardar el umbral"
        );
        return;
      }

      toast.success(`Stock bajo: ${limpio} unidades o menos`);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={abrir}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" icon={<AlertTriangle className="w-4 h-4" />}>
          Stock bajo: ≤ {value}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-neutral-900/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[110] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
          <Dialog.Title className="text-base font-medium text-neutral-900">
            Cuándo avisar de stock bajo
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-neutral-500">
            Un producto se marca en amarillo cuando le queda esta cantidad de
            unidades o menos. Vale para todos los productos de la tienda.
          </Dialog.Description>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft((v) => Math.max(1, v - 1))}
              aria-label="Bajar el umbral"
              className="w-10 h-10 rounded-lg bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4 text-neutral-900" />
            </button>
            <input
              type="number"
              min={1}
              max={9999}
              value={draft}
              onChange={(e) => setDraft(parseInt(e.target.value, 10) || 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
              aria-label="Unidades"
              className="flex-1 h-10 px-4 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 text-center font-semibold tabular-nums focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setDraft((v) => Math.min(9999, v + 1))}
              aria-label="Subir el umbral"
              className="w-10 h-10 rounded-lg bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-neutral-900" />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button size="sm" loading={saving} onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
