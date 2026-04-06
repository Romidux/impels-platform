"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
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

export default function CategoriesManager({
  storeId,
  categories: initialCategories,
  productCounts = {},
}: CategoriesManagerProps) {
  const router = useRouter();
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
      setExpandedIds(prev => [...prev, addingSubOf]);
    }
  }, [addingSubOf, expandedIds]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    // Evitar toggle si se clickea en botones de acción o inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
        prev.map((c) =>
          c.id === id ? { ...c, name: editName.trim() } : c
        )
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
    if (
      !confirm(
        "¿Eliminar esta categoría? Los productos no serán eliminados."
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const CategoryRow = ({
    category,
    isSubcategory = false,
    isLast = false,
    hasChildren = false,
    isExpanded = false,
    onToggle = () => {},
  }: {
    category: Category;
    isSubcategory?: boolean;
    isLast?: boolean;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggle?: (e: React.MouseEvent) => void;
  }) => (
    <div
      onClick={!isSubcategory ? onToggle : undefined}
      className={cn(
        "flex items-center gap-2 group transition-all duration-200",
        isSubcategory 
          ? "pl-12 py-2.5 hover:bg-slate-50/40" 
          : "px-4 py-4 hover:bg-slate-50/70 border-b border-slate-100/50 cursor-pointer select-none"
      )}
    >
      {isSubcategory ? (
        <div className="relative self-stretch flex items-center pr-4">
          <div className={cn(
            "absolute left-[-22px] top-0 w-[1px] bg-slate-200",
            isLast ? "h-1/2" : "h-full"
          )} />
          <div className="absolute left-[-22px] top-1/2 w-[22px] h-[1px] bg-slate-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-dash-accent transition-colors shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-3 pr-1">
          {/* Chevron */}
          <div className="w-5 flex justify-center">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 group-hover:bg-dash-primary/10 group-hover:text-dash-primary transition-all duration-300">
            <FolderOpen className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center gap-4">
        {editingId === category.id ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit(category.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 dash-input py-1 text-sm h-9"
            />
          </div>
        ) : (
          <>
            <span className={cn(
              "font-medium transition-colors",
              isSubcategory 
                ? "text-sm text-slate-500 group-hover:text-slate-900" 
                : "text-[15px] font-semibold text-slate-900 group-hover:text-dash-primary"
            )}>
              {category.name}
            </span>
            {(productCounts[category.id] ?? 0) > 0 && (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {productCounts[category.id]} prod.
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0 pr-2">
        {editingId === category.id ? (
          <>
            <button
              onClick={() => handleEdit(category.id)}
              disabled={saving}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-green-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-150"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600 transition-all duration-150"
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
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-dash-primary transition-all duration-150"
                title="Agregar subcategoría"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(category.id);
                setEditName(category.name);
              }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-150",
                isSubcategory
                  ? "bg-transparent border border-transparent text-slate-400 hover:bg-slate-50 hover:border-slate-200 hover:text-dash-primary"
                  : "bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-dash-primary"
              )}
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(category.id);
              }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-150",
                isSubcategory
                  ? "bg-transparent border border-transparent text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  : "bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              )}
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const AddRow = ({
    parentId,
    onCancel,
    isLastInTree = false,
  }: {
    parentId?: string;
    onCancel: () => void;
    isLastInTree?: boolean;
  }) => (
    <div
      className={cn(
        "flex items-center gap-3 group animate-fade-in",
        parentId ? "pl-12 py-3 mr-4" : "px-4 py-4 border-b border-slate-100/50"
      )}
    >
      {parentId ? (
        <div className="relative self-stretch flex items-center pr-4">
          <div className={cn(
            "absolute left-[-22px] top-0 w-[1px] bg-slate-200",
            isLastInTree ? "h-1/2" : "h-full"
          )} />
          <div className="absolute left-[-22px] top-1/2 w-[22px] h-[1px] bg-slate-200" />
          <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
          <Plus className="w-4 h-4 font-bold" />
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
        placeholder={parentId ? "Nueva subcategoría..." : "Nombre de la categoría principal..."}
        className="flex-1 dash-input h-9 text-sm"
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleAdd(parentId)}
          disabled={saving || !newName.trim()}
          className="flex items-center gap-1.5 bg-dash-primary hover:bg-dash-hover text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

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

      <div className="dash-card overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col">
          {adding && (
            <AddRow onCancel={() => { setAdding(false); setNewName(""); }} />
          )}

          {parentCategories.length === 0 && !adding ? (
            <div className="p-20 text-center bg-slate-50/30">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Tags className="w-10 h-10 text-dash-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">
                Sin categorías aún
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Organiza tu tienda estructurando tus productos en categorías. Mejora la experiencia de tus clientes.
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
            <div className="flex flex-col">
              {parentCategories.map((cat) => {
                const subcats = getSubcategories(cat.id);
                const isSearchingSub = addingSubOf === cat.id;
                const isExpanded = expandedIds.includes(cat.id);
                
                return (
                  <motion.div layout key={cat.id} className="flex flex-col">
                    <CategoryRow 
                      category={cat} 
                      hasChildren={subcats.length > 0}
                      isExpanded={isExpanded}
                      onToggle={(e) => toggleExpand(cat.id, e)}
                    />
                    
                    {/* Container for sub-levels with Animation */}
                    <AnimatePresence initial={false}>
                      {(isExpanded || isSearchingSub) && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden flex flex-col bg-slate-50/20"
                          layout
                        >
                          <div className="py-1.5 flex flex-col">
                            {subcats.map((sub, sIdx) => (
                              <CategoryRow
                                key={sub.id}
                                category={sub}
                                isSubcategory
                                isLast={sIdx === subcats.length - 1 && !isSearchingSub}
                              />
                            ))}
                            
                            {isSearchingSub && (
                              <AddRow
                                parentId={cat.id}
                                isLastInTree={true}
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
