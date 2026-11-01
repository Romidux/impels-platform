"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  FolderPlus,
  Check,
  X,
  Tags,
  ChevronRight,
  GripVertical,
  ArrowUpDown,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Category } from "@/lib/types";
import { slugify, cn } from "@/lib/utils";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "./SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";

interface CategoriesManagerProps {
  storeId: string;
  categories: Category[];
  productCounts?: Record<string, number>;
}

/* ─── Grid column template (shared by header + rows) ──────────────────────────
   Antes era una sola plantilla fija de cuatro columnas
   (`1fr 90px 120px 136px`). Las tres fijas suman 346px y en un teléfono la
   tarjeta mide 317px, así que la fila medía 386px y se salían 69px por debajo
   del `overflow-hidden`: el nombre quedaba en 40px y la columna de acciones no
   se alcanzaba nunca. Ahora las columnas secundarias aparecen recién cuando hay
   lugar, como en las tablas de Productos e Inventario, y abajo de sm su dato
   viaja en la línea de meta del nombre. */
const GRID_COLS =
  "grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_auto] lg:grid-cols-[1fr_100px_130px_148px]";

/* ─── Chip de visibilidad ─────────────────────────────────────────────────────
   Es el control, no un cartel: antes la columna mostraba Activa/Inactiva y no
   había forma de cambiarlo en ninguna pantalla, mientras el storefront filtra
   por `is_active`. Se dibuja una sola vez por fila (en la columna en lg, en la
   línea de meta abajo de lg) para no repetir dos controles del mismo dato. */
function VisibilityChip({
  category,
  busy,
  onToggle,
}: {
  category: Category;
  busy: boolean;
  onToggle: (category: Category) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(category);
      }}
      disabled={busy}
      title={
        category.is_active
          ? "Visible en la tienda — tocá para ocultarla"
          : "Oculta en la tienda — tocá para mostrarla"
      }
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150 disabled:opacity-50",
        category.is_active
          ? "bg-brand-50 text-brand-700 border-brand-700/15 hover:bg-brand-100"
          : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          category.is_active ? "bg-brand-500" : "bg-neutral-300"
        )}
      />
      {category.is_active ? "Activa" : "Oculta"}
    </button>
  );
}

/* ─── Category Row ────────────────────────────────────────────────────────────
   Vive en el módulo, no adentro de CategoriesManager. Definida adentro, cada
   render creaba una función nueva, React la trataba como otro componente y
   desmontaba la fila entera: el input de edición se remontaba en cada tecla, el
   cursor saltaba al final y las tildes y la ñ se cortaban a la mitad. */
function CategoryRow({
  category,
  isSubcategory = false,
  hasChildren = false,
  isExpanded = false,
  subcategoryCount = 0,
  productCount,
  nestedProductCount = 0,
  isEditing,
  editName,
  saving,
  togglingId,
  onToggle,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAddSub,
  onDelete,
  onToggleActive,
}: {
  category: Category;
  isSubcategory?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  subcategoryCount?: number;
  productCount: number;
  nestedProductCount?: number;
  isEditing: boolean;
  editName: string;
  saving: boolean;
  togglingId: string | null;
  onToggle?: (e: React.MouseEvent) => void;
  onEditNameChange: (value: string) => void;
  onStartEdit: (category: Category) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onAddSub: (id: string) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category) => void;
}) {
  const isExpandable = !isSubcategory && hasChildren;

  return (
    <div
      onClick={isExpandable ? onToggle : undefined}
      onKeyDown={
        isExpandable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      role={isExpandable ? "button" : undefined}
      tabIndex={isExpandable ? 0 : undefined}
      aria-expanded={isExpandable ? isExpanded : undefined}
      className={cn(
        GRID_COLS,
        "items-center group transition-colors duration-100",
        isSubcategory ? "bg-white hover:bg-neutral-50" : "hover:bg-neutral-50",
        isExpandable
          ? "cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
          : !isSubcategory
            ? "cursor-default select-none"
            : ""
      )}
    >
      {/* ── Col 1: Categoría ────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 py-4 pr-3 sm:pr-4 min-w-0",
          isSubcategory ? "pl-10 sm:pl-[3.25rem]" : "pl-4 sm:pl-6"
        )}
      >
        {/* Chevron — solo padres, solo si tiene hijos */}
        {!isSubcategory && (
          <div className="w-5 flex items-center justify-center flex-shrink-0">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="text-brand-600 group-hover:text-brand-700 transition-colors"
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
            <div className="w-px h-5 bg-neutral-300 rounded-full flex-shrink-0" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 group-hover:bg-brand-600 transition-colors flex-shrink-0" />
          </div>
        ) : (
          /* La carpeta sigue al estado de la rama: cerrada cuando está plegada.
             Antes era FolderOpen siempre, incluso con las hijas escondidas. */
          <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors duration-150">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 transition-colors duration-150" />
            ) : (
              <Folder className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 transition-colors duration-150" />
            )}
          </div>
        )}

        {/* Nombre / input edición */}
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") onSaveEdit(category.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            className="flex-1 min-w-0 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
          />
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "truncate transition-colors duration-100",
                  isSubcategory
                    ? "text-sm text-neutral-500 group-hover:text-neutral-700"
                    : "text-sm font-medium text-neutral-900 group-hover:text-brand-600"
                )}
              >
                {category.name}
              </span>
              {!isSubcategory && subcategoryCount > 0 && (
                <span className="ml-0.5 text-2xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 leading-none">
                  {subcategoryCount} sub
                </span>
              )}
            </div>

            {/* Línea de meta — solo abajo de sm, donde no hay columnas para
                productos ni visibilidad. */}
            <div className="mt-1.5 flex items-center gap-2 sm:hidden">
              <span className="text-2xs text-neutral-400 tabular-nums">
                {productCount} prod.
                {nestedProductCount > 0 && ` · ${nestedProductCount} en subs`}
              </span>
              <VisibilityChip
                category={category}
                busy={togglingId === category.id}
                onToggle={onToggleActive}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Col 2: Productos ────────────────────────────────────────────── */}
      <div className="hidden sm:block px-4 lg:px-6 py-4">
        {/* El número lleva al listado ya filtrado: /dashboard/products soporta
            ?category= desde siempre y acá no se estaba usando. */}
        <Link
          href={`/dashboard/products?category=${category.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-neutral-500 tabular-nums hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
        >
          {productCount}
          {nestedProductCount > 0 && (
            <span className="text-2xs text-neutral-400">
              {" "}
              +{nestedProductCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── Col 3: Visibilidad ──────────────────────────────────────────── */}
      <div className="hidden lg:block px-6 py-4">
        <VisibilityChip
          category={category}
          busy={togglingId === category.id}
          onToggle={onToggleActive}
        />
      </div>

      {/* ── Col 4: Acciones ─────────────────────────────────────────────── */}
      <div className="pr-4 sm:pr-6 py-4">
        {/* Visibles siempre en touch (donde no hay hover y quedaban
            inalcanzables) y al enfocar con el teclado; en desktop siguen
            apareciendo con el mouse encima. */}
        <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150">
          {isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveEdit(category.id);
                }}
                disabled={saving}
                title="Guardar"
                className="p-2 rounded-lg text-brand-700 hover:bg-brand-50 transition-colors duration-150 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelEdit();
                }}
                title="Cancelar"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150"
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
                    onAddSub(category.id);
                  }}
                  title="Agregar subcategoría"
                  className="p-2 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-100 transition-colors duration-150"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(category);
                }}
                title="Editar"
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                title="Eliminar"
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add Row ─────────────────────────────────────────────────────────────── */
function AddRow({
  parentId,
  value,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  parentId?: string;
  value: string;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: (parentId?: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className={cn(GRID_COLS, "items-center", parentId ? "bg-white" : "")}>
      {/* Col 1: Input */}
      <div
        className={cn(
          "flex items-center gap-3 py-3 pr-3 sm:pr-4 min-w-0",
          parentId ? "pl-10 sm:pl-[3.25rem]" : "pl-4 sm:pl-6"
        )}
      >
        {/* Alineación con filas normales */}
        {!parentId && <div className="w-5 flex-shrink-0" />}

        {parentId ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-px h-5 bg-neutral-300 rounded-full flex-shrink-0" />
            <Plus className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-neutral-400" />
          </div>
        )}

        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(parentId);
            if (e.key === "Escape") onCancel();
          }}
          placeholder={
            parentId ? "Nueva subcategoría..." : "Nombre de la categoría..."
          }
          className="flex-1 min-w-0 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Col 2 & 3: vacíos (siguen a las columnas visibles en cada breakpoint) */}
      <div className="hidden sm:block px-4 lg:px-6 py-3" />
      <div className="hidden lg:block px-6 py-3" />

      {/* Col 4: Guardar / Cancelar */}
      <div className="pr-4 sm:pr-6 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onSave(parentId)}
            disabled={saving || !value.trim()}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Fila en modo ordenar ────────────────────────────────────────────────────
   El orden de esta pantalla es el que ve el cliente en la tienda
   (`getStoreCategories` ordena por `sort_order`) y hasta ahora no se podía
   cambiar: quedaba el orden de creación para siempre.

   La fila se arrastra solo desde la manija, no desde cualquier lado
   (`dragListener={false}` + `useDragControls`): así se puede seguir leyendo y
   seleccionando el nombre sin mover nada por accidente. La manija lleva
   `touch-none` porque sin eso, en el teléfono, el gesto se lo come el scroll de
   la página; y responde a las flechas del teclado para quien no puede
   arrastrar. */
function SortableRow({
  category,
  isSubcategory = false,
  subcategoryCount = 0,
  onMove,
  children,
}: {
  category: Category;
  isSubcategory?: boolean;
  subcategoryCount?: number;
  onMove: (direction: -1 | 1) => void;
  children?: React.ReactNode;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={category}
      as="div"
      dragListener={false}
      dragControls={controls}
      /* `relative` va en la clase y no en whileDrag: si `position` entra como
         propiedad animada, framer la devuelve a `static` en reposo y
         Reorder.Item deja de poder desplazarse. */
      className="relative bg-white"
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
    >
      <div
        className={cn(
          "flex items-center gap-3 py-4 pr-4 sm:pr-6",
          isSubcategory ? "pl-8 sm:pl-10" : "pl-3 sm:pl-4"
        )}
      >
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onMove(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onMove(1);
            }
          }}
          aria-label={`Mover ${category.name}: flechas arriba y abajo`}
          className="touch-none cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-colors flex-shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {isSubcategory ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-px h-5 bg-neutral-300 rounded-full flex-shrink-0" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0">
            <Folder className="w-4 h-4 text-neutral-400" />
          </div>
        )}

        <span
          className={cn(
            "truncate",
            isSubcategory
              ? "text-sm text-neutral-500"
              : "text-sm font-medium text-neutral-900"
          )}
        >
          {category.name}
        </span>

        {!isSubcategory && subcategoryCount > 0 && (
          <span className="text-2xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 leading-none">
            {subcategoryCount} sub
          </span>
        )}
      </div>

      {children}
    </Reorder.Item>
  );
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modo ordenar: se entra a propósito, se arrastra todo lo que haga falta y
  // recién al salir se escribe. Guardar en cada soltada haría una tanda de
  // escrituras por cada movimiento y dejaría la tienda a mitad de camino si se
  // corta algo en el medio.
  const [reordering, setReordering] = useState(false);
  const [orderBackup, setOrderBackup] = useState<Category[] | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [query, setQuery] = useState("");

  // Accordion state
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const supabase = createClient();

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  // Productos colgados de las subcategorías de un padre. El contador del padre
  // contaba solo lo asignado a él mismo, así que una categoría que reparte todo
  // en sus hijas mostraba 0 y parecía vacía.
  const getNestedProductCount = (parentId: string) =>
    getSubcategories(parentId).reduce(
      (total, sub) => total + (productCounts[sub.id] ?? 0),
      0
    );

  // Búsqueda en memoria: la página trae el árbol completo, no hay paginación.
  const term = query.trim().toLowerCase();
  const matches = (c: Category) => c.name.toLowerCase().includes(term);

  // Una categoría padre queda visible si coincide ella o si coincide alguna de
  // sus hijas: si no, buscar "remeras" dentro de "Ropa" no encontraría nada.
  const visibleParents = term
    ? parentCategories.filter(
        (p) => matches(p) || getSubcategories(p.id).some(matches)
      )
    : parentCategories;

  // Si el padre coincide se muestran todas sus hijas (el match es la rama
  // entera); si coinciden solo algunas hijas, se muestran únicamente esas.
  const getVisibleSubcategories = (parent: Category) => {
    const subs = getSubcategories(parent.id);
    if (!term || matches(parent)) return subs;
    return subs.filter(matches);
  };

  // Auto-expand when adding subcategory
  useEffect(() => {
    if (addingSubOf && !expandedIds.includes(addingSubOf)) {
      setExpandedIds((prev) => [...prev, addingSubOf]);
    }
  }, [addingSubOf, expandedIds]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input"))
      return;
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ─── CRUD handlers ────────────────────────────────────────────────────── */

  // Dos categorías con el mismo nombre generan el mismo slug y por lo tanto la
  // misma URL en la tienda. Se avisa acá en vez de dejar que la base responda
  // con un error genérico.
  const slugTaken = (name: string, exceptId?: string) => {
    const slug = slugify(name.trim());
    return categories.some((c) => c.id !== exceptId && c.slug === slug);
  };

  const handleAdd = async (parentId?: string) => {
    if (!newName.trim()) {
      toast.error("Ingresa un nombre");
      return;
    }
    if (slugTaken(newName)) {
      toast.error(`Ya existe una categoría llamada "${newName.trim()}"`);
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
          // Última de su nivel. Antes era `categories.length`, un contador
          // global: una subcategoría nueva podía nacer con un número más alto
          // que cualquier padre y el orden no significaba nada.
          sort_order: parentId
            ? getSubcategories(parentId).length
            : parentCategories.length,
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
      router.refresh();
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
    if (slugTaken(editName, id)) {
      toast.error(`Ya existe una categoría llamada "${editName.trim()}"`);
      return;
    }
    const nextName = editName.trim();
    const nextSlug = slugify(nextName);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: nextName, slug: nextSlug })
        .eq("id", id);
      if (error) throw error;
      // El slug también cambia en la base: si no se refleja acá, el estado
      // local queda con el viejo hasta recargar.
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: nextName, slug: nextSlug } : c
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

  const handleToggleActive = async (category: Category) => {
    const next = !category.is_active;
    setTogglingId(category.id);
    // Optimista: el chip responde al toque y se revierte si la base falla.
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: next } : c))
    );
    const { error } = await supabase
      .from("categories")
      .update({ is_active: next })
      .eq("id", category.id);
    setTogglingId(null);
    if (error) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: !next } : c
        )
      );
      toast.error("No se pudo cambiar la visibilidad");
      return;
    }
    toast.success(
      next
        ? `"${category.name}" ya se ve en la tienda`
        : `"${category.name}" quedó oculta en la tienda`
    );
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const subs = getSubcategories(pendingDelete.id);
    setDeleting(true);
    try {
      // Las hijas se borran explícitamente en vez de confiar en que la foreign
      // key tenga ON DELETE CASCADE: si no lo tuviera, quedarían colgando en la
      // base mientras desaparecen de la pantalla.
      if (subs.length > 0) {
        const { error: subsError } = await supabase
          .from("categories")
          .delete()
          .in(
            "id",
            subs.map((s) => s.id)
          );
        if (subsError) throw subsError;
      }
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) throw error;
      setCategories((prev) =>
        prev.filter(
          (c) => c.id !== pendingDelete.id && c.parent_id !== pendingDelete.id
        )
      );
      toast.success("Categoría eliminada");
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Orden ────────────────────────────────────────────────────────────── */

  // El orden vive en el orden del array: `parentCategories` y
  // `getSubcategories` filtran sin reordenar, así que mover acá alcanza.
  const applyParentOrder = (next: Category[]) =>
    setCategories((prev) => [...next, ...prev.filter((c) => c.parent_id)]);

  const applySubOrder = (parentId: string, next: Category[]) =>
    setCategories((prev) => [
      ...prev.filter((c) => c.parent_id !== parentId),
      ...next,
    ]);

  // Mismo movimiento que el arrastre, para las flechas del teclado.
  const moveWithin = (list: Category[], id: string, direction: -1 | 1) => {
    const from = list.findIndex((c) => c.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= list.length) return null;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const startReordering = () => {
    setOrderBackup(categories);
    setQuery("");
    setAdding(false);
    setAddingSubOf(null);
    setEditingId(null);
    // Todo abierto: si una rama queda plegada, sus subcategorías no se pueden
    // ordenar y no hay forma de darse cuenta.
    setExpandedIds(
      categories.filter((c) => !c.parent_id).map((c) => c.id)
    );
    setReordering(true);
  };

  const cancelReordering = () => {
    if (orderBackup) setCategories(orderBackup);
    setOrderBackup(null);
    setReordering(false);
  };

  const handleSaveOrder = async () => {
    // `sort_order` se renumera 0..n dentro de cada nivel. Venía del contador
    // global de `categories.length`, así que los valores saltaban y no querían
    // decir nada.
    const objetivo: { id: string; sort_order: number }[] = [];
    parentCategories.forEach((parent, index) => {
      objetivo.push({ id: parent.id, sort_order: index });
      getSubcategories(parent.id).forEach((sub, subIndex) => {
        objetivo.push({ id: sub.id, sort_order: subIndex });
      });
    });

    const cambios = objetivo.filter((t) => {
      const actual = categories.find((c) => c.id === t.id);
      return actual && actual.sort_order !== t.sort_order;
    });

    if (cambios.length === 0) {
      setReordering(false);
      setOrderBackup(null);
      return;
    }

    setSavingOrder(true);
    try {
      const results = await Promise.all(
        cambios.map((t) =>
          supabase
            .from("categories")
            .update({ sort_order: t.sort_order })
            .eq("id", t.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;

      const porId = new Map(cambios.map((t) => [t.id, t.sort_order]));
      setCategories((prev) =>
        prev.map((c) =>
          porId.has(c.id) ? { ...c, sort_order: porId.get(c.id)! } : c
        )
      );
      toast.success("Orden guardado");
      setReordering(false);
      setOrderBackup(null);
      router.refresh();
    } catch {
      toast.error("No se pudo guardar el orden");
    } finally {
      setSavingOrder(false);
    }
  };

  /* Productos que quedan sin categoría si se confirma el borrado: los de la
     categoría más los de todas sus hijas. */
  const deleteImpact = pendingDelete
    ? {
        subs: getSubcategories(pendingDelete.id).length,
        products:
          (productCounts[pendingDelete.id] ?? 0) +
          getNestedProductCount(pendingDelete.id),
      }
    : null;

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Categorías"
        subtitle="Organiza la estructura de tu catálogo de productos"
        actions={
          reordering ? (
            <>
              <Button
                variant="secondary"
                onClick={cancelReordering}
                disabled={savingOrder}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveOrder} loading={savingOrder}>
                Guardar orden
              </Button>
            </>
          ) : (
            <>
              {parentCategories.length > 1 && (
                <Button
                  variant="secondary"
                  onClick={startReordering}
                  icon={<ArrowUpDown className="w-4 h-4" />}
                >
                  Ordenar
                </Button>
              )}
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
            </>
          )
        }
      />

      {parentCategories.length > 0 && !reordering && (
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar categoría o subcategoría..."
          className="max-w-xs"
        />
      )}

      {reordering && (
        <div className="flex items-start gap-2.5 rounded-xl border border-brand-700/15 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <GripVertical className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-600" />
          <p>
            Arrastrá desde la manija para cambiar el orden. Así quedan listadas
            en tu tienda. Las subcategorías se ordenan dentro de su categoría.
          </p>
        </div>
      )}

      {/* La tarjeta usa dash-card como el resto del dashboard. Estaba armada a
          mano con rounded-2xl (el radio de los paneles del shell) y sin sombra,
          mientras el skeleton de loading.tsx sí usaba dash-card: al terminar de
          cargar, la tarjeta cambiaba de radio delante tuyo. */}
      <div className="dash-card overflow-hidden">
        {reordering ? (
          /* ── Modo ordenar ───────────────────────────────────────────── */
          <Reorder.Group
            axis="y"
            as="div"
            values={parentCategories}
            onReorder={applyParentOrder}
            className="divide-y divide-neutral-50"
          >
            {parentCategories.map((cat) => {
              const subs = getSubcategories(cat.id);
              return (
                <SortableRow
                  key={cat.id}
                  category={cat}
                  subcategoryCount={subs.length}
                  onMove={(direction) => {
                    const next = moveWithin(parentCategories, cat.id, direction);
                    if (next) applyParentOrder(next);
                  }}
                >
                  {subs.length > 0 && (
                    <Reorder.Group
                      axis="y"
                      as="div"
                      values={subs}
                      onReorder={(next) =>
                        applySubOrder(cat.id, next as Category[])
                      }
                      className="border-t border-neutral-50 divide-y divide-neutral-50"
                    >
                      {subs.map((sub) => (
                        <SortableRow
                          key={sub.id}
                          category={sub}
                          isSubcategory
                          onMove={(direction) => {
                            const next = moveWithin(subs, sub.id, direction);
                            if (next) applySubOrder(cat.id, next);
                          }}
                        />
                      ))}
                    </Reorder.Group>
                  )}
                </SortableRow>
              );
            })}
          </Reorder.Group>
        ) : parentCategories.length === 0 && !adding ? (
          /* ── Empty state ────────────────────────────────────────────── */
          <EmptyState
            icon={<Tags className="w-7 h-7" />}
            heading="Sin categorías aún"
            description="Organiza tu tienda estructurando tus productos en categorías. Mejora la experiencia de tus clientes."
            action={
              <Button
                onClick={() => setAdding(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Crear primera categoría
              </Button>
            }
          />
        ) : (
          <>
            {/* ── Table header ──────────────────────────────────────────── */}
            <div
              className={cn(
                GRID_COLS,
                "bg-neutral-50 border-b border-neutral-200"
              )}
            >
              <div className="text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide pl-4 sm:pl-6 py-4">
                Categoría
              </div>
              <div className="hidden sm:block text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-4 lg:px-6 py-4">
                Productos
              </div>
              <div className="hidden lg:block text-left text-2xs font-medium text-neutral-400 uppercase tracking-wide px-6 py-4">
                Visibilidad
              </div>
              <div className="text-right text-2xs font-medium text-neutral-400 uppercase tracking-wide pr-4 sm:pr-6 py-4">
                Acciones
              </div>
            </div>

            {/* ── Add row (top-level) ────────────────────────────────────── */}
            {adding && (
              <div className="border-b border-neutral-50">
                <AddRow
                  value={newName}
                  saving={saving}
                  onChange={setNewName}
                  onSave={handleAdd}
                  onCancel={() => {
                    setAdding(false);
                    setNewName("");
                  }}
                />
              </div>
            )}

            {/* ── Rows ──────────────────────────────────────────────────── */}
            <div className="divide-y divide-neutral-50">
              {term && visibleParents.length === 0 && (
                <EmptyState
                  icon={<Tags className="w-7 h-7" />}
                  heading="Sin resultados"
                  description={`Ninguna categoría coincide con "${query}". Prueba con otro nombre.`}
                  action={
                    <Button variant="secondary" onClick={() => setQuery("")}>
                      Ver todas las categorías
                    </Button>
                  }
                />
              )}
              {visibleParents.map((cat) => {
                const subcats = getVisibleSubcategories(cat);
                const isSearchingSub = addingSubOf === cat.id;
                // Durante una búsqueda la rama se abre sola: si la coincidencia
                // está en una hija, dejarla plegada equivale a no encontrarla.
                const isExpanded =
                  expandedIds.includes(cat.id) ||
                  (term.length > 0 && subcats.length > 0);

                return (
                  <div key={cat.id}>
                    {/* Parent row */}
                    <CategoryRow
                      category={cat}
                      hasChildren={subcats.length > 0}
                      isExpanded={isExpanded}
                      subcategoryCount={subcats.length}
                      productCount={productCounts[cat.id] ?? 0}
                      nestedProductCount={getNestedProductCount(cat.id)}
                      isEditing={editingId === cat.id}
                      editName={editName}
                      saving={saving}
                      togglingId={togglingId}
                      onToggle={(e) => toggleExpand(cat.id, e)}
                      onEditNameChange={setEditName}
                      onStartEdit={(c) => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                      onSaveEdit={handleEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onAddSub={(id) => {
                        setAddingSubOf(id);
                        setAdding(false);
                        setNewName("");
                      }}
                      onDelete={setPendingDelete}
                      onToggleActive={handleToggleActive}
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
                          <div className="border-t border-neutral-50 divide-y divide-neutral-50">
                            {subcats.map((sub) => (
                              <CategoryRow
                                key={sub.id}
                                category={sub}
                                isSubcategory
                                productCount={productCounts[sub.id] ?? 0}
                                isEditing={editingId === sub.id}
                                editName={editName}
                                saving={saving}
                                togglingId={togglingId}
                                onEditNameChange={setEditName}
                                onStartEdit={(c) => {
                                  setEditingId(c.id);
                                  setEditName(c.name);
                                }}
                                onSaveEdit={handleEdit}
                                onCancelEdit={() => setEditingId(null)}
                                onAddSub={() => {}}
                                onDelete={setPendingDelete}
                                onToggleActive={handleToggleActive}
                              />
                            ))}
                            {isSearchingSub && (
                              <AddRow
                                parentId={cat.id}
                                value={newName}
                                saving={saving}
                                onChange={setNewName}
                                onSave={handleAdd}
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

      {/* Reemplaza el confirm() nativo, igual que en las acciones de producto:
          el del sistema no puede nombrar la categoría ni decir qué se lleva
          puesto. */}
      <Dialog.Root
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-neutral-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[110] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
            <Dialog.Title className="text-base font-medium text-neutral-900">
              Eliminar categoría
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-neutral-500">
              Vas a eliminar{" "}
              <span className="text-neutral-900">{pendingDelete?.name}</span>.
              Esta acción no se puede deshacer.
            </Dialog.Description>

            {deleteImpact &&
              (deleteImpact.subs > 0 || deleteImpact.products > 0) && (
                <ul className="mt-4 space-y-1.5 text-sm text-neutral-500">
                  {deleteImpact.subs > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" />
                      <span>
                        Se eliminan también{" "}
                        <span className="text-neutral-900">
                          {deleteImpact.subs}{" "}
                          {deleteImpact.subs === 1
                            ? "subcategoría"
                            : "subcategorías"}
                        </span>
                        .
                      </span>
                    </li>
                  )}
                  {deleteImpact.products > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" />
                      <span>
                        <span className="text-neutral-900">
                          {deleteImpact.products}{" "}
                          {deleteImpact.products === 1
                            ? "producto queda"
                            : "productos quedan"}
                        </span>{" "}
                        sin categoría. No se eliminan.
                      </span>
                    </li>
                  )}
                </ul>
              )}

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
    </div>
  );
}
