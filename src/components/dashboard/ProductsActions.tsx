"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Pencil,
  ExternalLink,
  Star,
  StarOff,
  Loader2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/* Menú de acciones de un producto.
 *
 * Antes eran dos íconos sueltos (duplicar y eliminar) alineados a la derecha.
 * Un menú escala: entran acciones nuevas sin que la columna crezca, y las que
 * ya existían dejan de depender de que se adivine qué hace cada ícono.
 *
 * La visibilidad NO está acá a propósito: tiene su propia columna con el chip
 * "Visible". Repetirla sería dar dos lugares para lo mismo.
 *
 * Usa el DropdownMenu de Radix, que ya era dependencia del proyecto y no se
 * usaba en ningún lado. Trae navegación con flechas, cierre con Escape, manejo
 * de foco y portal — todo eso falta en el dropdown a mano de VisibilityDropdown.
 */

const itemClass =
  "flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 text-sm text-neutral-700 outline-none transition-colors data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

const iconClass = "h-4 w-4 shrink-0 text-neutral-400";

export default function ProductsActions({
  productId,
  productName,
  productSlug,
  storeSlug,
  isFeatured = false,
}: {
  productId: string;
  productName?: string;
  productSlug?: string;
  storeSlug?: string;
  isFeatured?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [featured, setFeatured] = useState(isFeatured);
  const [, startTransition] = useTransition();

  const refresh = () => startTransition(() => router.refresh());

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      toast.success("Producto eliminado");
      setConfirmOpen(false);
      refresh();
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFeatured = async () => {
    const next = !featured;
    setFeaturing(true);
    // Optimista: el cambio se ve al instante y se revierte si falla. Es un
    // toggle de una sola columna, no justifica esperar el viaje al servidor.
    setFeatured(next);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("products")
        .update({ is_featured: next })
        .eq("id", productId);
      if (error) throw error;
      toast.success(next ? "Producto destacado" : "Ya no está destacado");
      refresh();
    } catch {
      setFeatured(!next);
      toast.error("No se pudo cambiar el destacado");
    } finally {
      setFeaturing(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const supabase = createClient();

      const { data: original, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError || !original) throw new Error("Producto no encontrado");

      const { id, created_at, updated_at, slug, ...productData } = original;
      void id;
      void created_at;
      void updated_at;
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
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al duplicar el producto"
      );
    } finally {
      setDuplicating(false);
    }
  };

  const storefrontHref =
    storeSlug && productSlug
      ? `/store/${storeSlug}/product/${productSlug}`
      : null;

  const busy = deleting || duplicating || featuring;

  return (
    <>
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            aria-label="Acciones del producto"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-brand-500 data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[190px] rounded-lg border border-neutral-200 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <DropdownMenu.Item asChild>
              <Link href={`/dashboard/products/${productId}`} className={itemClass}>
                <Pencil className={iconClass} />
                Editar
              </Link>
            </DropdownMenu.Item>

            {storefrontHref && (
              <DropdownMenu.Item asChild>
                <a
                  href={storefrontHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClass}
                >
                  <ExternalLink className={iconClass} />
                  Ver en la tienda
                </a>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Item
              className={itemClass}
              disabled={featuring}
              onSelect={(e) => {
                e.preventDefault();
                handleToggleFeatured();
              }}
            >
              {featured ? (
                <StarOff className={iconClass} />
              ) : (
                <Star className={iconClass} />
              )}
              {featured ? "No destacar" : "Destacar"}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className={itemClass}
              disabled={duplicating}
              onSelect={(e) => {
                e.preventDefault();
                handleDuplicate();
              }}
            >
              <Copy className={iconClass} />
              Duplicar
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-neutral-200" />

            <DropdownMenu.Item
              className={cn(
                itemClass,
                "text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
              )}
              /* preventDefault para que Radix no devuelva el foco al trigger
                 mientras se abre el diálogo; el menú se cierra a mano. */
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0 text-red-500" />
              Eliminar
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Reemplaza el confirm() nativo que había antes: ese lo dibuja el sistema
          operativo, se ve distinto en cada navegador y no se puede nombrar el
          producto que se está por borrar. */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-neutral-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[110] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
            <Dialog.Title className="text-base font-medium text-neutral-900">
              Eliminar producto
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-neutral-500">
              {productName ? (
                <>
                  Vas a eliminar <span className="text-neutral-900">{productName}</span>.
                  Esta acción no se puede deshacer.
                </>
              ) : (
                "Esta acción no se puede deshacer."
              )}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary" size="sm">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
