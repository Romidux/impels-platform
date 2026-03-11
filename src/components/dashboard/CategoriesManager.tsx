"use client";

import { useState } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

interface CategoriesManagerProps {
  storeId: string;
  categories: Category[];
}

export default function CategoriesManager({
  storeId,
  categories: initialCategories,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [adding, setAdding] = useState(false);
  const [addingSubOf, setAddingSubOf] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

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
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const hasProducts = false; // Could check via count query
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
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const CategoryRow = ({
    category,
    isSubcategory = false,
  }: {
    category: Category;
    isSubcategory?: boolean;
  }) => (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        isSubcategory ? "pl-10 bg-gray-50/80" : ""
      } hover:bg-gray-50 transition-colors group`}
    >
      {isSubcategory ? (
        <div className="w-4 h-4 text-gray-300">↳</div>
      ) : (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      )}

      {editingId === category.id ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEdit(category.id);
            if (e.key === "Escape") setEditingId(null);
          }}
          className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-gray-800">
          {category.name}
        </span>
      )}

      <span className="text-xs text-gray-400 hidden sm:block">
        /{category.slug}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {editingId === category.id ? (
          <>
            <button
              onClick={() => handleEdit(category.id)}
              disabled={saving}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {!isSubcategory && (
              <button
                onClick={() => {
                  setAddingSubOf(category.id);
                  setAdding(false);
                  setNewName("");
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Agregar subcategoría"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                setEditingId(category.id);
                setEditName(category.name);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const AddRow = ({
    parentId,
    onCancel,
  }: {
    parentId?: string;
    onCancel: () => void;
  }) => (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 ${parentId ? "pl-10 bg-blue-50/30" : ""}`}
    >
      <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <input
        autoFocus
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd(parentId);
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Nombre de la categoría..."
        className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
      />
      <button
        onClick={() => handleAdd(parentId)}
        disabled={saving}
        className="flex items-center gap-1 gradient-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
      >
        <Check className="w-3.5 h-3.5" />
        Guardar
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Categorías
          </h1>
          <p className="text-gray-500 mt-1">
            {parentCategories.length} categorías •{" "}
            {categories.filter((c) => c.parent_id).length} subcategorías
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setAddingSubOf(null);
            setNewName("");
          }}
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      <div className="card-flat overflow-hidden">
        {adding && (
          <div className="border-b border-gray-100">
            <AddRow onCancel={() => { setAdding(false); setNewName(""); }} />
          </div>
        )}

        {parentCategories.length === 0 && !adding ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Tags className="w-9 h-9 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
              Sin categorías
            </h3>
            <p className="text-gray-400 mb-6">
              Organiza tus productos en categorías para facilitar la navegación
            </p>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-3 rounded-xl hover:shadow-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear primera categoría
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {parentCategories.map((cat) => (
              <div key={cat.id}>
                <CategoryRow category={cat} />
                {/* Subcategories */}
                {getSubcategories(cat.id).map((sub) => (
                  <CategoryRow
                    key={sub.id}
                    category={sub}
                    isSubcategory
                  />
                ))}
                {/* Add subcategory row */}
                {addingSubOf === cat.id && (
                  <AddRow
                    parentId={cat.id}
                    onCancel={() => {
                      setAddingSubOf(null);
                      setNewName("");
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
