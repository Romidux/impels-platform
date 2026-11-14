"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* Prender el seguimiento de stock desde la fila, que es donde te das cuenta de
   que lo querías. El interruptor vive en la edición del producto y nace
   apagado, así que hasta ahora había que entrar producto por producto —y antes
   que eso, adivinar que el producto existía, porque sin seguimiento ni
   siquiera aparecía en esta pantalla. */
export default function StartTrackingButton({
  productId,
  productName,
  currentStock,
}: {
  productId: string;
  productName: string;
  /** Stock que tiene guardado el producto. Importa porque si es 0, prender el
   *  seguimiento lo deja agotado de cara al cliente. */
  currentStock: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ track_inventory: true })
        .eq("id", productId);

      if (error) throw error;

      /* Hasta acá el producto se vendía siempre. Si arranca en 0, prender el
         seguimiento lo deja agotado en la tienda desde este mismo click, y eso
         no se puede dejar implícito. */
      if (currentStock > 0) {
        toast.success(`"${productName}" ahora lleva cuenta de stock`);
      } else {
        toast.warning(
          `"${productName}" lleva cuenta de stock y está en 0: figura agotado en tu tienda hasta que cargues unidades`
        );
      }
      router.refresh();
    } catch {
      toast.error("No se pudo activar el seguimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="inline-flex items-center gap-1.5 text-2xs font-medium text-neutral-500 hover:text-brand-700 hover:bg-brand-50 border border-neutral-200 hover:border-brand-200 px-2 py-1 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {saving && <Loader2 className="w-3 h-3 animate-spin" />}
      Llevar stock
    </button>
  );
}
