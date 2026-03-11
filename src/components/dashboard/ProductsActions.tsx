"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ProductsActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/dashboard/products/${productId}`}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
