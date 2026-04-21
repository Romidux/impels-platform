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
  stock_quantity: number;
  has_variants: boolean;
  manage_stock_by_variant: boolean;
  price: number;
  categoryName: string;
  imageUrl: string | null;
  variants: VariantForInventory[];
}

interface InventoryTableProps {
  products: InventoryProduct[];
  maxStock: number;
  currency: string;
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
      <div className="relative bg-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.16)] border border-[#E5E5EA] w-full max-w-md animate-fade-in">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1D1D1F]">
                {titles[action]}
              </h3>
              <p className="text-sm text-[#86868B] mt-1">
                {descriptions[action]}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-[10px] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input (for set and adjust) */}
          {action !== "zero" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1D1D1F]">
                {action === "set" ? "Nuevo stock" : "Cantidad a ajustar"}
              </label>
              <div className="flex items-center gap-2">
                {action === "adjust" && (
                  <button
                    type="button"
                    onClick={() => setValue((v) => v - 1)}
                    className="w-10 h-10 rounded-[10px] bg-[#F5F5F7] hover:bg-[#EBEBED] flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-[#1D1D1F]" />
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
                  className="flex-1 h-10 px-4 border border-[#E5E5EA] rounded-[10px] bg-white text-sm text-[#1D1D1F] text-center font-bold tabular-nums focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all"
                  autoFocus
                  min={action === "set" ? 0 : undefined}
                />
                {action === "adjust" && (
                  <button
                    type="button"
                    onClick={() => setValue((v) => v + 1)}
                    className="w-10 h-10 rounded-[10px] bg-[#F5F5F7] hover:bg-[#EBEBED] flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#1D1D1F]" />
                  </button>
                )}
              </div>
              {action === "adjust" && (
                <p className="text-xs text-[#86868B]">
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
                <p className="text-sm font-semibold text-red-800">
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
              className="flex-1 h-10 rounded-[12px] border border-[#E5E5EA] text-sm font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(action === "zero" ? undefined : value)}
              disabled={isPending || (action === "adjust" && value === 0)}
              className={cn(
                "flex-1 h-10 rounded-[12px] text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                action === "zero"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#0071E3] hover:bg-[#0077ED]"
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
function VariantStockEditor({ variantId, currentStock }: { variantId: string; currentStock: number }) {
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
        <span className={`text-sm font-bold tabular-nums ${currentStock <= 0 ? "text-red-600" : currentStock <= 5 ? "text-amber-600" : "text-slate-900"}`}>{currentStock}</span>
        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">editar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setValue(Math.max(0, value - 1))} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><Minus className="w-3 h-3 text-slate-600" /></button>
      <input type="number" value={value} onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))} onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setValue(currentStock); setEditing(false); }}} autoFocus min={0} className="w-14 h-7 text-center text-sm font-bold border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white" />
      <button onClick={() => setValue(value + 1)} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><Plus className="w-3 h-3 text-slate-600" /></button>
      <button onClick={handleSave} disabled={saving} className="w-6 h-6 rounded-md bg-green-100 hover:bg-green-200 flex items-center justify-center disabled:opacity-50"><Check className="w-3 h-3 text-green-700" /></button>
      <button onClick={() => { setValue(currentStock); setEditing(false); }} className="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center"><X className="w-3 h-3 text-red-500" /></button>
    </div>
  );
}

// ── Main Table Component ──
export default function InventoryTable({
  products,
  maxStock,
  currency,
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

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const isAllSelected = products.length > 0 && selected.size === products.length;
  const isSomeSelected = selected.size > 0 && selected.size < products.length;

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

      toast.success(actionLabels[bulkAction]);
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
      <div className="bg-white border border-[#E5E5EA] rounded-[24px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                {/* Checkbox header */}
                <th className="pl-5 py-4 w-12">
                  <label className="flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-md border-[#D1D1D6] text-[#0071E3] focus:ring-[#0071E3]/20 focus:ring-offset-0 cursor-pointer accent-[#0071E3]"
                    />
                  </label>
                </th>
                <th className="pl-2 py-4 w-14" />
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4">
                  Producto
                </th>
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4 hidden sm:table-cell">
                  Categoría
                </th>
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4">
                  Stock
                </th>
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4 hidden md:table-cell w-36">
                  Nivel
                </th>
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4 hidden lg:table-cell">
                  Valor
                </th>
                <th className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-4 py-4">
                  Estado
                </th>
                <th className="text-right text-xs font-medium text-[#86868B] uppercase tracking-wide pr-6 py-4">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7]">
              {products.map((product) => {
                const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;
                const isOut = product.stock_quantity <= 0;
                const stockValue = (product.stock_quantity || 0) * (product.price || 0);
                const stockPct = Math.min(((product.stock_quantity || 0) / maxStock) * 100, 100);
                const barColor = isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400";
                const isSelected = selected.has(product.id);
                const hasExpandableVariants = product.has_variants && product.manage_stock_by_variant && product.variants.length > 0;
                const isExpanded = expandedRows.has(product.id);

                return (
                  <Fragment key={product.id}>
                  <tr
                    key={product.id}
                    className={cn(
                      "transition-colors duration-100 group",
                      isSelected ? "bg-[#F0F6FF]/60" : "hover:bg-[#F7F7F8]"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 py-3 w-12">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} className="w-4 h-4 rounded-md border-[#D1D1D6] text-[#0071E3] focus:ring-[#0071E3]/20 focus:ring-offset-0 cursor-pointer accent-[#0071E3]" />
                      </label>
                    </td>
                    {/* Image */}
                    <td className="pl-2 py-3 w-14">
                      <div className="w-10 h-10 rounded-[10px] overflow-hidden bg-[#F5F5F7] flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-[#C7C7CC]" /></div>
                        )}
                      </div>
                    </td>
                    {/* Product name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {hasExpandableVariants && (
                          <button onClick={() => toggleExpand(product.id)} className="p-0.5 hover:bg-[#F0F0F2] rounded-md transition-colors flex-shrink-0">
                            <ChevronRight className={cn("w-4 h-4 text-[#86868B] transition-transform", isExpanded && "rotate-90")} />
                          </button>
                        )}
                        <div>
                          <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-sm text-[#1D1D1F] hover:text-[#0071E3] transition-colors">
                            {product.name}
                          </Link>
                          {hasExpandableVariants && (
                            <span className="ml-2 text-[10px] font-medium text-[#0071E3] bg-[#F0F6FF] px-1.5 py-0.5 rounded-md cursor-pointer" onClick={() => toggleExpand(product.id)}>
                              {product.variants.length} variantes
                            </span>
                          )}
                          {product.has_variants && !product.manage_stock_by_variant && (
                            <span className="ml-2 text-[10px] font-medium text-[#86868B] bg-[#F5F5F7] px-1.5 py-0.5 rounded-md">Variantes</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3.5 hidden sm:table-cell"><span className="text-sm text-[#86868B]">{product.categoryName || "—"}</span></td>
                    {/* Stock editor */}
                    <td className="px-4 py-3.5">
                      {hasExpandableVariants ? (
                        <span className="text-sm font-bold tabular-nums text-[#1D1D1F]">{product.stock_quantity}<span className="text-[10px] font-normal text-[#86868B] ml-1">total</span></span>
                      ) : (
                        <InlineStockEditor productId={product.id} currentStock={product.stock_quantity} />
                      )}
                    </td>
                    {/* Stock bar */}
                    <td className="px-4 py-3.5 hidden md:table-cell w-36">
                      <div className="flex-1 h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${stockPct}%` }} />
                      </div>
                    </td>
                    {/* Value */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-sm font-medium text-[#1D1D1F] tabular-nums whitespace-nowrap">{formatCurrency(stockValue, currency)}</span>
                    </td>
                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <Badge variant={isOut ? "error" : isLow ? "warning" : "success"} dot>
                        {isOut ? "Sin stock" : isLow ? "Bajo" : "OK"}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="pr-6 py-3.5 text-right">
                      <Link href={`/dashboard/products/${product.id}`} className="p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-[#F0F6FF] rounded-[10px] transition-colors inline-flex" title="Editar producto">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                  {/* ── Variant sub-rows ── */}
                  {hasExpandableVariants && isExpanded && product.variants.map((v) => {
                    const vOut = v.stock <= 0;
                    const vLow = v.stock > 0 && v.stock <= 5;
                    return (
                      <tr key={v.id} className="bg-[#FAFBFC] border-t border-[#F0F0F2] animate-fade-in">
                        <td className="pl-5 py-2 w-12" />
                        <td className="pl-2 py-2 w-14" />
                        <td className="px-4 py-2" colSpan={1}>
                          <div className="flex items-center gap-2 pl-6">
                            <div className="w-1 h-4 bg-[#E5E5EA] rounded-full" />
                            <div className="flex flex-wrap gap-1">
                              {v.label.split(" / ").map((val, i) => (
                                <span key={i} className="inline-block bg-[#F0F0F2] text-[#6E6E73] text-[11px] font-medium px-2 py-0.5 rounded-md">{val}</span>
                              ))}
                            </div>
                            {v.sku && <span className="text-[10px] text-[#86868B] font-mono">{v.sku}</span>}
                            {!v.is_active && <Badge variant="neutral" size="sm">Inactivo</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell" />
                        <td className="px-4 py-2"><VariantStockEditor variantId={v.id} currentStock={v.stock} /></td>
                        <td className="px-4 py-2 hidden md:table-cell w-36" />
                        <td className="px-4 py-2 hidden lg:table-cell" />
                        <td className="px-4 py-2">
                          <Badge variant={vOut ? "error" : vLow ? "warning" : "success"} dot size="sm">
                            {vOut ? "Sin stock" : vLow ? "Bajo" : "OK"}
                          </Badge>
                        </td>
                        <td className="pr-6 py-2" />
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

      {/* ── Floating Bulk Actions Bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="bg-[#1D1D1F] text-white rounded-[16px] shadow-[0_16px_48px_rgba(0,0,0,0.24)] border border-white/10 px-5 py-3 flex items-center gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/15">
              <div className="w-6 h-6 rounded-full bg-[#0071E3] flex items-center justify-center text-xs font-bold">
                {selected.size}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                seleccionado{selected.size !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAction("adjust")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[10px] bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajustar
              </button>
              <button
                onClick={() => setBulkAction("set")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[10px] bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <Package className="w-3.5 h-3.5" />
                Establecer
              </button>
              <button
                onClick={() => setBulkAction("zero")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-[10px] bg-red-500/80 hover:bg-red-500 transition-colors whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Sin stock
              </button>
            </div>

            {/* Close */}
            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/10 rounded-[8px] transition-colors ml-1"
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
