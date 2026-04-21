"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  FolderPlus,
  Check,
  X,
  Tags,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Category } from "@/lib/types";
import { slugify, cn } from "@/lib/utils";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

interface CategoriesManagerProps {
  storeId: string;
  categories: Category[];
  productCounts?: Record<string, number>;
}

/* ─── Grid column template (shared by header + rows) ─────────────────────── */
const GRID_COLS =
  "grid grid-cols-[1fr_90px_120px_136px] sm:grid-cols-[1fr_100px_130px_148px]";

export default function CategoriesManager({
  storeId,
  categories: initialCategories,
  productCounts = {},
}: CategoriesManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [adding, setAdding] = useState(false);
  const [addingSubOf, setAddingSubOf] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Accordion state
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const supabase = createClient();

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  // Auto-expand when adding subcategory
  useEffect(() => {
    if (addingSubOf && !expandedIds.includes(addingSubOf)) {
      setExpandedIds((prev) => [...prev, addingSubOf]);
    }
  }, [addingSubOf, expandedIds]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ─── CRUD handlers ────────────────────────────────────────────────────── */
  const handleAdd = async (parentId?: string) => {
    if (!newName.trim()) {
      toast.error("Ingresa un nombre");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          store_id: storeId,
          name: newName.trim(),
          slug: slugify(newName.trim()),
          parent_id: parentId || null,
          sort_order: categories.length,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setCategories((prev) => [...prev, data]);
      toast.success("Categoría creada");
      setNewName("");
      setAdding(false);
      setAddingSubOf(null);
    } catch {
      toast.error("Error al crear categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Ingresa un nombre");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editName.trim(), slug: slugify(editName.trim()) })
        .eq("id", id);
      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c))
      );
      toast.success("Categoría actualizada");
      setEditingId(null);
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los productos no serán eliminados."))
      return;
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCategories((prev) =>
        prev.filter((c) => c.id !== id && c.parent_id !== id)
      );
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  /* ─── Category Row ─────────────────────────────────────────────────────── */
  const CategoryRow = ({
    category,
    isSubcategory = false,
    hasChildren = false,
    isExpanded = false,
    subcategoryCount = 0,
    onToggle = () => { },
  }: {
    category: Category;
    isSubcategory?: boolean;
    hasChildren?: boolean;
    isExpanded?: boolean;
    subcategoryCount?: number;
    onToggle?: (e: React.MouseEvent) => void;
  }) => {
    const count = productCounts[category.id] ?? 0;
    const isEditing = editingId === category.id;
    const isExpandable = !isSubcategory && hasChildren;

    return (
      <div
        onClick={!isSubcategory ? onToggle : undefined}
        className={cn(
          GRID_COLS,
          "items-center group transition-colors duration-100",
          isSubcategory
            ? "bg-[#FAFAFA] hover:bg-[#F5F5F7]"
            : "hover:bg-[#F7F7F8]",
          isExpandable ? "cursor-pointer select-none" : !isSubcategory ? "cursor-default select-none" : ""
        )}
      >
        {/* ── Col 1: Categoría ──────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center gap-3 py-4 pr-4",
            isSubcategory ? "pl-[3.25rem]" : "pl-6"
          )}
        >
          {/* Chevron — solo padres, solo si tiene hijos */}
          {!isSubcategory && (
            <div className="w-5 flex items-center justify-center flex-shrink-0">
              {hasChildren ? (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="text-[#0071E3] group-hover:text-[#0063CC] transition-colors"
                >
                  <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </motion.div>
              ) : (
                /* placeholder para mantener alineación */
                <div className="w-[18px] h-[18px]" />
              )}
            </div>
          )}

          {/* Icono / bullet */}
          {isSubcategory ? (
            /* Bullet con línea vertical árbol */
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-px h-5 bg-[#D1D1D6] rounded-full flex-shrink-0" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C7C7CC] group-hover:bg-[#0071E3] transition-colors flex-shrink-0" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-[10px] bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E8F0FE] transition-colors duration-150">
              <FolderOpen className="w-4 h-4 text-[#86868B] group-hover:text-[#0071E3] transition-colors duration-150" />
            </div>
          )}

          {/* Nombre / input edición */}
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit(category.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 min-w-0 bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-1.5 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 focus:border-[#0071E3] transition-all"
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "truncate transition-colors duration-100",
                  isSubcategory
                    ? "text-sm text-[#6E6E73] group-hover:text-[#3A3A3C]"
                    : "text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3]"
                )}
              >
                {category.name}
              </span>
              {!isSubcategory && subcategoryCount > 0 && (
                <span className="ml-0.5 text-[11px] font-medium text-[#86868B] bg-[#F0F0F2] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 leading-none">
                  {subcategoryCount} sub
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Col 2: Productos ──────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <span className="text-sm text-[#6E6E73] tabular-nums">{count}</span>
        </div>

        {/* ── Col 3: Visibilidad ────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
              category.is_active
                ? "bg-[#F0FFF4] text-[#1A7F4B] border-[#1A7F4B]/15"
                : "bg-[#F5F5F7] text-[#86868B] border-[#E5E5EA]"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                category.is_active ? "bg-[#34C759]" : "bg-[#C7C7CC]"
              )}
            />
            {category.is_active ? "Activa" : "Inactiva"}
          </span>
        </div>

        {/* ── Col 4: Acciones ───────────────────────────────────────────── */}
        <div className="pr-6 py-4">
          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(category.id);
                  }}
                  disabled={saving}
                  title="Guardar"
                  className="p-2 rounded-[8px] text-[#1A7F4B] hover:bg-[#F0FFF4] transition-colors duration-150 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(null);
                  }}
                  title="Cancelar"
                  className="p-2 rounded-[8px] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {!isSubcategory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingSubOf(category.id);
                      setAdding(false);
                      setNewName("");
                    }}
                    title="Agregar subcategoría"
                    className="p-2 rounded-[8px] text-[#86868B] hover:text-[#0071E3] hover:bg-[#E8F0FE] transition-colors duration-150"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(category.id);
                    setEditName(category.name);
                  }}
                  title="Editar"
                  className="p-2 rounded-[8px] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors duration-150"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category.id);
                  }}
                  title="Eliminar"
                  className="p-2 rounded-[8px] text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF2F2] transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Add Row ──────────────────────────────────────────────────────────── */
  const AddRow = ({
    parentId,
    onCancel,
  }: {
    parentId?: string;
    onCancel: () => void;
  }) => (
    <div
      className={cn(
        GRID_COLS,
        "items-center",
        parentId ? "bg-[#FAFAFA]" : ""
      )}
    >
      {/* Col 1: Input */}
      <div
        className={cn(
          "flex items-center gap-3 py-3 pr-4",
          parentId ? "pl-[3.25rem]" : "pl-6"
        )}
      >
        {/* Alineación con filas normales */}
        {!parentId && <div className="w-5 flex-shrink-0" />}

        {parentId ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-px h-5 bg-[#D1D1D6] rounded-full flex-shrink-0" />
            <Plus className="w-3.5 h-3.5 text-[#86868B] flex-shrink-0" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-[10px] bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-[#86868B]" />
          </div>
        )}

        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd(parentId);
            if (e.key === "Escape") onCancel();
          }}
          placeholder={
            parentId ? "Nueva subcategoría..." : "Nombre de la categoría..."
          }
          className="flex-1 min-w-0 bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-1.5 text-sm text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 focus:border-[#0071E3] transition-all"
        />
      </div>

      {/* Col 2 & 3: vacíos */}
      <div className="px-6 py-3" />
      <div className="px-6 py-3" />

      {/* Col 4: Guardar / Cancelar */}
      <div className="pr-6 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleAdd(parentId)}
            disabled={saving || !newName.trim()}
            className="inline-flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0063CC] active:bg-[#0055B3] text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-colors duration-150 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="p-2 rounded-[8px] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Categorías"
        subtitle="Organiza la estructura de tu catálogo de productos"
        actions={
          <Button
            onClick={() => {
              setAdding(true);
              setAddingSubOf(null);
              setNewName("");
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Nueva categoría
          </Button>
        }
      />

      <div className="bg-white border border-[#E5E5EA] rounded-[24px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {parentCategories.length === 0 && !adding ? (
          /* ── Empty state ────────────────────────────────────────────── */
          <div className="p-20 text-center bg-[#FAFAFA]">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center mx-auto mb-6 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Tags className="w-10 h-10 text-[#0071E3]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
              Sin categorías aún
            </h3>
            <p className="text-[#6E6E73] mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Organiza tu tienda estructurando tus productos en categorías.
              Mejora la experiencia de tus clientes.
            </p>
            <Button
              onClick={() => setAdding(true)}
              className="px-8"
              icon={<Plus className="w-5 h-5" />}
            >
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <>
            {/* ── Table header ──────────────────────────────────────────── */}
            <div className={cn(GRID_COLS, "bg-[#F5F5F7] border-b border-[#E5E5EA]")}>
              <div className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide pl-6 py-4">
                Categoría
              </div>
              <div className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-6 py-4">
                Productos
              </div>
              <div className="text-left text-xs font-medium text-[#86868B] uppercase tracking-wide px-6 py-4">
                Visibilidad
              </div>
              <div className="text-right text-xs font-medium text-[#86868B] uppercase tracking-wide pr-6 py-4">
                Acciones
              </div>
            </div>

            {/* ── Add row (top-level) ────────────────────────────────────── */}
            {adding && (
              <div className="border-b border-[#F5F5F7]">
                <AddRow
                  onCancel={() => {
                    setAdding(false);
                    setNewName("");
                  }}
                />
              </div>
            )}

            {/* ── Rows ──────────────────────────────────────────────────── */}
            <div className="divide-y divide-[#F5F5F7]">
              {parentCategories.map((cat) => {
                const subcats = getSubcategories(cat.id);
                const isSearchingSub = addingSubOf === cat.id;
                const isExpanded = expandedIds.includes(cat.id);

                return (
                  <div key={cat.id}>
                    {/* Parent row */}
                    <CategoryRow
                      category={cat}
                      hasChildren={subcats.length > 0}
                      isExpanded={isExpanded}
                      subcategoryCount={subcats.length}
                      onToggle={(e) => toggleExpand(cat.id, e)}
                    />

                    {/* Subcategories — animated */}
                    <AnimatePresence initial={false}>
                      {(isExpanded || isSearchingSub) && (
                        <motion.div
                          key="subcats"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#F5F5F7] divide-y divide-[#F5F5F7]">
                            {subcats.map((sub) => (
                              <CategoryRow
                                key={sub.id}
                                category={sub}
                                isSubcategory
                              />
                            ))}
                            {isSearchingSub && (
                              <AddRow
                                parentId={cat.id}
                                onCancel={() => {
                                  setAddingSubOf(null);
                                  setNewName("");
                                }}
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
