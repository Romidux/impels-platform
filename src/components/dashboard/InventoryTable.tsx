"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  ImageIcon,
  Package,
  X,
  Minus,
  Plus,
  Check,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import InlineStockEditor from "@/components/dashboard/InlineStockEditor";
import StartTrackingButton from "@/components/dashboard/StartTrackingButton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──
export interface VariantForInventory {
  id: string;
  label: string;
  stock: number;
  sku: string;
  is_active: boolean;
}

export interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  /** Stock real: suma de las variantes cuando el producto maneja stock por
   *  variante, `stock_quantity` en el resto. Es el que mira la tienda. */
  stock: number;
  /** Campo crudo de la fila. Solo lo usa el editor en línea, que únicamente se
   *  muestra en productos sin stock por variante. */
  stock_quantity: number;
  /** Si el producto lleva cuenta de stock (`track_inventory`). Cuando no, no
   *  tiene stock que mostrar, editar ni sumar: se vende siempre. */
  tracked: boolean;
  has_variants: boolean;
  manage_stock_by_variant: boolean;
  price: number;
  categoryName: string;
  imageUrl: string | null;
  variants: VariantForInventory[];
}

interface InventoryTableProps {
  products: InventoryProduct[];
  currency: string;
  /** Unidades o menos para considerar un producto en stock bajo. Lo elige la
   *  tienda (`store_settings.low_stock_threshold`); antes era un 5 escrito a
   *  mano acá adentro y en la page. */
  lowStockThreshold: number;
}

// ── Bulk Action Modal ──
function BulkActionModal({
  action,
  selectedCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  action: "set" | "adjust" | "zero";
  selectedCount: number;
  onConfirm: (value?: number) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState(0);

  const titles: Record<string, string> = {
    set: "Establecer stock",
    adjust: "Ajustar stock",
    zero: "Marcar sin stock",
  };

  const descriptions: Record<string, string> = {
    set: `Se establecerá el stock de ${selectedCount} producto${selectedCount !== 1 ? "s" : ""} al valor indicado.`,
    adjust: `Se sumará o restará la cantidad indicada al stock actual de ${selectedCount} producto${selectedCount !== 1 ? "s" : ""}. Usa números negativos para restar.`,
    zero: `Se pondrá en 0 el stock de ${selectedCount} producto${selectedCount !== 1 ? "s" : ""}. Esta acción no se puede deshacer fácilmente.`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.16)] border border-neutral-200 w-full max-w-md animate-fade-in">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-neutral-900">
                {titles[action]}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                {descriptions[action]}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input (for set and adjust) */}
          {action !== "zero" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-900">
                {action === "set" ? "Nuevo stock" : "Cantidad a ajustar"}
              </label>
              <div className="flex items-center gap-2">
                {action === "adjust" && (
                  <button
                    type="button"
                    onClick={() => setValue((v) => v - 1)}
                    className="w-10 h-10 rounded-lg bg-neutral-50 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-neutral-900" />
                  </button>
                )}
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setValue(
                      action === "set"
                        ? Math.max(0, parseInt(e.target.value) || 0)
                        : parseInt(e.target.value) || 0
                    )
                  }
                  className="flex-1 h-10 px-4 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 text-center font-semibold tabular-nums focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                  autoFocus
                  min={action === "set" ? 0 : undefined}
                />
                {action === "adjust" && (
                  <button
                    type="button"
                    onClick={() => setValue((v) => v + 1)}
                    className="w-10 h-10 rounded-lg bg-neutral-50 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-neutral-900" />
                  </button>
                )}
              </div>
              {action === "adjust" && (
                <p className="text-xs text-neutral-400">
                  {value > 0
                    ? `Se sumarán ${value} unidades a cada producto`
                    : value < 0
                    ? `Se restarán ${Math.abs(value)} unidades de cada producto`
                    : "Sin cambios"}
                </p>
              )}
            </div>
          )}

          {/* Warning for zero */}
          {action === "zero" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-[14px]">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  ¿Estás seguro?
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Todos los productos seleccionados quedarán con stock 0 y se
                  mostrarán como agotados en la tienda.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(action === "zero" ? undefined : value)}
              disabled={isPending || (action === "adjust" && value === 0)}
              className={cn(
                "flex-1 h-10 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                action === "zero"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-brand-600 hover:bg-brand-500"
              )}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aplicando...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Variant Inline Stock Editor ──
function VariantStockEditor({ variantId, currentStock, lowStockThreshold }: { variantId: string; currentStock: number; lowStockThreshold: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentStock);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (value === currentStock) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stock: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Stock de variante actualizado a ${value}`);
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
      setValue(currentStock);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 cursor-pointer" title="Editar stock">
        <span className={`text-sm font-semibold tabular-nums ${currentStock <= 0 ? "text-red-600" : currentStock <= lowStockThreshold ? "text-amber-600" : "text-neutral-900"}`}>{currentStock}</span>
        <span className="text-2xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">editar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setValue(Math.max(0, value - 1))} className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"><Minus className="w-3 h-3 text-neutral-600" /></button>
      <input type="number" value={value} onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setValue(currentStock); setEditing(false); }}} autoFocus min={0} className="w-14 h-7 text-center text-sm font-semibold border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/10 bg-white" />
      <button onClick={() => setValue(value + 1)} className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"><Plus className="w-3 h-3 text-neutral-600" /></button>
      <button onClick={handleSave} disabled={saving} className="w-6 h-6 rounded-md bg-brand-100 hover:bg-brand-200 flex items-center justify-center disabled:opacity-50"><Check className="w-3 h-3 text-brand-700" /></button>
      <button onClick={() => { setValue(currentStock); setEditing(false); }} className="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center"><X className="w-3 h-3 text-red-500" /></button>
    </div>
  );
}

// ── Main Table Component ──
export default function InventoryTable({
  products,
  currency,
  lowStockThreshold,
}: InventoryTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"set" | "adjust" | "zero" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Selection handlers ──
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* Las acciones masivas escriben stock, así que solo alcanzan a los productos
     que llevan cuenta. Seleccionar uno sin seguimiento sería elegir algo sobre
     lo que la acción no puede hacer nada. */
  const seleccionables = products.filter((p) => p.tracked);

  const toggleSelectAll = () => {
    if (selected.size === seleccionables.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(seleccionables.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const isAllSelected =
    seleccionables.length > 0 && selected.size === seleccionables.length;
  const isSomeSelected =
    selected.size > 0 && selected.size < seleccionables.length;

  // ── Bulk action handler ──
  const handleBulkAction = async (value?: number) => {
    if (!bulkAction || selected.size === 0) return;

    try {
      const res = await fetch("/api/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          productIds: Array.from(selected),
          value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al actualizar stock");
        return;
      }

      const actionLabels: Record<string, string> = {
        set: `Stock establecido a ${value} en ${data.updated} productos`,
        adjust: `Stock ajustado (${value! > 0 ? "+" : ""}${value}) en ${data.updated} productos`,
        zero: `${data.updated} productos marcados sin stock`,
      };

      /* El servidor omite los productos con stock por variante en Establecer y
         Ajustar: su stock es la suma de las variantes y no hay forma de
         repartir un número entre ellas. Decirlo, en vez de dejar creer que se
         aplicó a todo lo seleccionado. */
      const omitidos = (data.skipped as number) || 0;
      const aviso =
        omitidos > 0
          ? ` · ${omitidos} con stock por variante quedaron sin tocar`
          : "";

      if (data.updated === 0 && omitidos > 0) {
        toast.warning(
          `No se cambió nada: ${omitidos === 1 ? "el producto seleccionado maneja" : "los productos seleccionados manejan"} stock por variante. Editá cada variante desde la fila.`
        );
      } else {
        toast.success(actionLabels[bulkAction] + aviso);
      }
      setBulkAction(null);
      clearSelection();

      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <>
      <div className="dash-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* El `sticky top-0` que había acá no hacía nada y se sacó: el
                encabezado se iba con el scroll igual. El scroll vertical lo
                tiene el panel del dashboard, pero este contenedor es
                `overflow-x-auto` — y eso lo vuelve un contenedor de scroll
                propio, sin alto limitado, así que nunca scrollea y el sticky
                nunca se activa. Que quede fijo de verdad es reestructurar de
                dónde cuelga el scroll, no una clase. */}
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                {/* Checkbox header */}
                <th className="pl-5 py-3 w-12">
                  <label className="flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-md border-neutral-300 text-brand-600 focus:ring-brand-500/10 focus:ring-offset-0 cursor-pointer accent-brand-600"
                    />
                  </label>
                </th>
                <th className="pl-2 py-3 w-14" />
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                  Producto
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">
                  Categoría
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3">
                  Stock
                </th>
                <th className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">
                  Valor
                </th>
                <th className="w-px whitespace-nowrap text-right text-2xs font-medium text-neutral-400 uppercase tracking-wide pr-6 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.map((product) => {
                const isLow = product.stock > 0 && product.stock <= lowStockThreshold;
                const isOut = product.stock <= 0;
                const stockValue = product.stock * (product.price || 0);
                const isSelected = selected.has(product.id);
                const hasExpandableVariants = product.has_variants && product.manage_stock_by_variant && product.variants.length > 0;
                const isExpanded = expandedRows.has(product.id);

                return (
                  <Fragment key={product.id}>
                  <tr
                    key={product.id}
                    className={cn(
                      "transition-colors duration-100 group",
                      isSelected ? "bg-brand-50/60" : "hover:bg-neutral-50"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 py-3 w-12">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!product.tracked}
                          title={product.tracked ? undefined : "Este producto no lleva cuenta de stock"}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 rounded-md border-neutral-300 text-brand-600 focus:ring-brand-500/10 focus:ring-offset-0 cursor-pointer accent-brand-600 disabled:cursor-not-allowed disabled:opacity-30"
                        />
                      </label>
                    </td>
                    {/* Image */}
                    <td className="pl-2 py-3 w-14">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-neutral-300" /></div>
                        )}
                      </div>
                    </td>
                    {/* Product name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {hasExpandableVariants && (
                          <button onClick={() => toggleExpand(product.id)} className="p-0.5 hover:bg-neutral-100 rounded-md transition-colors flex-shrink-0">
                            <ChevronRight className={cn("w-4 h-4 text-neutral-400 transition-transform", isExpanded && "rotate-90")} />
                          </button>
                        )}
                        <div>
                          <Link href={`/dashboard/products/${product.id}`} className="font-medium text-sm text-neutral-900 hover:text-brand-600 transition-colors">
                            {product.name}
                          </Link>
                          {/* Era un <span> con onClick: no se llegaba con el
                              teclado ni lo anunciaba un lector de pantalla. */}
                          {hasExpandableVariants && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(product.id)}
                              aria-expanded={isExpanded}
                              className="ml-2 text-2xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-1.5 py-0.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                              {product.variants.length} variantes
                            </button>
                          )}
                          {product.has_variants && !product.manage_stock_by_variant && (
                            <span className="ml-2 text-2xs font-medium text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded-md">Variantes</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-neutral-400">{product.categoryName || "—"}</span></td>
                    {/* Stock — número y estado en una sola celda.
                        Eran tres columnas (Stock, Nivel, Estado) diciendo lo
                        mismo: el número coloreado, una barra coloreada y un
                        badge coloreado. Ahora el número solo; la palabra
                        aparece únicamente cuando hay algo que hacer, y el "OK"
                        verde desapareció: pintaba de color justo las filas que
                        no necesitan atención. */}
                    <td className="px-4 py-3">
                      {!product.tracked ? (
                        /* Sin seguimiento no es stock cero: en este código
                           significa stock infinito, el producto se vende
                           siempre. Va en gris, sin número inventado, y con la
                           forma de empezar a contarlo al lado. */
                        <div className="flex items-center gap-2">
                          <span className="text-2xs text-neutral-400 whitespace-nowrap">
                            Sin seguimiento
                          </span>
                          <StartTrackingButton
                            productId={product.id}
                            productName={product.name}
                            currentStock={product.stock}
                          />
                        </div>
                      ) : (
                      <div className="flex items-baseline gap-2">
                        {hasExpandableVariants ? (
                          /* "total" es de verdad la suma de las variantes. */
                          <span className={cn("text-sm font-semibold tabular-nums", isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-neutral-900")}>
                            {product.stock}
                            <span className="text-2xs font-normal text-neutral-400 ml-1">total</span>
                          </span>
                        ) : (
                          <InlineStockEditor productId={product.id} currentStock={product.stock_quantity} lowStockThreshold={lowStockThreshold} />
                        )}
                        {(isOut || isLow) && (
                          <span className={cn("text-2xs font-medium whitespace-nowrap", isOut ? "text-red-600" : "text-amber-600")}>
                            {isOut ? "Agotado" : "Bajo"}
                          </span>
                        )}
                      </div>
                      )}
                    </td>
                    {/* Value */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {product.tracked ? (
                        <span className="text-sm font-medium text-neutral-900 tabular-nums whitespace-nowrap">{formatCurrency(stockValue, currency)}</span>
                      ) : (
                        <span className="text-sm text-neutral-300">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="w-px whitespace-nowrap pr-6 py-3 text-right">
                      <Link href={`/dashboard/products/${product.id}`} className="p-2 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex" title="Editar producto">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                  {/* ── Variant sub-rows ── */}
                  {hasExpandableVariants && isExpanded && product.variants.map((v) => {
                    const vOut = v.stock <= 0;
                    const vLow = v.stock > 0 && v.stock <= lowStockThreshold;
                    return (
                      <tr key={v.id} className="bg-neutral-50 border-t border-neutral-100 animate-fade-in">
                        <td className="pl-5 py-2 w-12" />
                        <td className="pl-2 py-2 w-14" />
                        <td className="px-4 py-2" colSpan={1}>
                          <div className="flex items-center gap-2 pl-6">
                            <div className="w-1 h-4 bg-neutral-200 rounded-full" />
                            <div className="flex flex-wrap gap-1">
                              {v.label.split(" / ").map((val, i) => (
                                <span key={i} className="inline-block bg-neutral-100 text-neutral-500 text-2xs font-medium px-2 py-0.5 rounded-md">{val}</span>
                              ))}
                            </div>
                            {v.sku && <span className="text-2xs text-neutral-400 font-mono">{v.sku}</span>}
                            {!v.is_active && <Badge variant="neutral" size="sm">Inactivo</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell" />
                        <td className="px-4 py-2">
                          <div className="flex items-baseline gap-2">
                            <VariantStockEditor variantId={v.id} currentStock={v.stock} lowStockThreshold={lowStockThreshold} />
                            {(vOut || vLow) && (
                              <span className={cn("text-2xs font-medium whitespace-nowrap", vOut ? "text-red-600" : "text-amber-600")}>
                                {vOut ? "Agotado" : "Bajo"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell" />
                        <td className="w-px whitespace-nowrap pr-6 py-2" />
                      </tr>
                    );
                  })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Floating Bulk Actions Bar ──────────────────────────────────────
          El centrado va con flex y no con `left-1/2 -translate-x-1/2`: la
          animación `slideUp` escribe `transform` con fill-mode both y pisaba al
          `-translate-x-1/2` de Tailwind, así que la barra quedaba corrida media
          barra a la derecha. En mobile sube por encima del BottomNav y los
          botones quedan solo con ícono: con los textos medía 586px y no entra
          en un teléfono. */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-24 md:bottom-6 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto animate-slide-up bg-neutral-900 text-white rounded-[16px] shadow-[0_16px_48px_rgba(0,0,0,0.24)] border border-white/10 px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 max-w-full">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-white/15">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {selected.size}
              </div>
              <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
                seleccionado{selected.size !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAction("adjust")}
                title="Ajustar stock"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajustar</span>
              </button>
              <button
                onClick={() => setBulkAction("set")}
                title="Establecer stock"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <Package className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Establecer</span>
              </button>
              <button
                onClick={() => setBulkAction("zero")}
                title="Marcar sin stock"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-sm font-medium rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sin stock</span>
              </button>
            </div>

            {/* Close */}
            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              title="Deseleccionar todo"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Action Modal ── */}
      {bulkAction && (
        <BulkActionModal
          action={bulkAction}
          selectedCount={selected.size}
          onConfirm={handleBulkAction}
          onCancel={() => setBulkAction(null)}
          isPending={isPending}
        />
      )}
    </>
  );
}
