"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ProductsActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      toast.success("Producto eliminado");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const supabase = createClient();

      // Fetch original product
      const { data: original, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError || !original) throw new Error("Producto no encontrado");

      // Create duplicate with modified name and slug
      const { id, created_at, updated_at, slug, ...productData } = original;
      const timestamp = Date.now().toString(36);
      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert({
          ...productData,
          name: `${original.name} (copia)`,
          slug: `${slug}-copia-${timestamp}`,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Copy images
      const { data: images } = await supabase
        .from("product_images")
        .select("url, alt, sort_order, is_primary")
        .eq("product_id", productId);

      if (images && images.length > 0 && newProduct) {
        await supabase.from("product_images").insert(
          images.map((img) => ({
            product_id: newProduct.id,
            url: img.url,
            alt: img.alt,
            sort_order: img.sort_order,
            is_primary: img.is_primary,
          }))
        );
      }

      toast.success("Producto duplicado correctamente");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error(err.message || "Error al duplicar el producto");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        title="Duplicar producto"
        className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] rounded-[8px] transition-colors duration-150 disabled:opacity-50"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Eliminar producto"
        className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF2F2] rounded-[8px] transition-colors duration-150 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
