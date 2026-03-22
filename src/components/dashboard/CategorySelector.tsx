"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/types";
import DashSelect from "./ui/DashSelect";
import { Plus, Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CategorySelectorProps {
  storeId: string;
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export default function CategorySelector({
  storeId,
  categories: initialCategories,
  value,
  onChange,
}: CategorySelectorProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories);
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    setLocalCategories(initialCategories);
  }, [initialCategories]);

  // Estados para creación inline
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [isSavingParent, setIsSavingParent] = useState(false);

  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [isSavingChild, setIsSavingChild] = useState(false);

  // Sincronizar value
  useEffect(() => {
    if (!value) {
      setSelectedParent("");
      setSelectedChild("");
      return;
    }
    const cat = localCategories.find((c) => c.id === value);
    if (!cat) return;
    if (cat.parent_id) {
      setSelectedParent(cat.parent_id);
      setSelectedChild(cat.id);
    } else {
      setSelectedParent(cat.id);
      setSelectedChild("");
    }
  }, [value, localCategories]);

  // Manejadores de selects
  const handleParentSelect = (val: string) => {
    setSelectedParent(val);
    setSelectedChild("");
    if (!val) {
      onChange("");
    } else {
      onChange(val);
    }
  };

  const handleChildSelect = (val: string) => {
    setSelectedChild(val);
    if (val) {
      onChange(val);
    } else {
      onChange(selectedParent);
    }
  };

  // Creación de nueva categoría padre
  const handleSaveParent = async () => {
    const trimmedName = newParentName.trim();
    if (!trimmedName || !storeId) return setIsCreatingParent(false);
    
    // Validar duplicado
    const existing = localCategories.find(
      (c) => !c.parent_id && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      toast.info("La categoría ya existe");
      setIsCreatingParent(false);
      setNewParentName("");
      handleParentSelect(existing.id);
      return;
    }

    setIsSavingParent(true);
    
    const baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Obtenemos el max sort_order
    const maxSort = localCategories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);

    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: newParentName.trim(),
        slug: slug,
        is_active: true,
        sort_order: maxSort + 1,
      })
      .select()
      .single();

    setIsSavingParent(false);

    if (error) {
      console.error(error);
      toast.error("Error al crear la categoría");
      return;
    }

    setLocalCategories((prev) => [...prev, data as Category]);
    toast.success("Categoría agregada");
    setIsCreatingParent(false);
    setNewParentName("");
    handleParentSelect(data.id);
  };

  // Creación de nueva subcategoría
  const handleSaveChild = async () => {
    const trimmedName = newChildName.trim();
    if (!trimmedName || !selectedParent || !storeId) return setIsCreatingChild(false);
    
    // Validar duplicado
    const existing = localCategories.find(
      (c) => c.parent_id === selectedParent && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      toast.info("La subcategoría ya existe");
      setIsCreatingChild(false);
      setNewChildName("");
      handleChildSelect(existing.id);
      return;
    }

    setIsSavingChild(true);
    
    const baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    
    const children = localCategories.filter(c => c.parent_id === selectedParent);
    const maxSort = children.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);

    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: newChildName.trim(),
        slug: slug,
        parent_id: selectedParent,
        is_active: true,
        sort_order: maxSort + 1,
      })
      .select()
      .single();

    setIsSavingChild(false);

    if (error) {
      console.error(error);
      toast.error("Error al crear subcategoría");
      return;
    }

    setLocalCategories((prev) => [...prev, data as Category]);
    toast.success("Subcategoría agregada");
    setIsCreatingChild(false);
    setNewChildName("");
    handleChildSelect(data.id);
  };

  const parentCategories = localCategories.filter((c) => !c.parent_id);
  const availableSubcategories = localCategories.filter(
    (c) => c.parent_id === selectedParent
  );

  return (
    <div className="space-y-4">
      {/* Categoria Principal */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-bold text-slate-700">Categoría Principal</label>
        
        {isCreatingParent ? (
          <div className="flex animate-fade-in items-center gap-2 bg-[#f4f4f4] rounded-2xl p-1.5 border border-[#d9d9d9] shadow-inner">
            <input
              autoFocus
              type="text"
              placeholder="Ej: Zapatillas..."
              value={newParentName}
              onChange={(e) => setNewParentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveParent()}
              className="flex-1 bg-transparent px-3 py-2 text-[14px] font-medium text-slate-700 focus:outline-none"
              disabled={isSavingParent}
            />
            <button
              type="button"
              onClick={handleSaveParent}
              disabled={isSavingParent || !newParentName.trim()}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSavingParent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setIsCreatingParent(false); setNewParentName(""); }}
              disabled={isSavingParent}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <DashSelect
              searchable
              value={selectedParent}
              onChange={handleParentSelect}
              placeholder="Seleccionar categoría"
              options={[
                ...parentCategories.map(c => ({ value: c.id, label: c.name }))
              ]}
              actionElement={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreatingParent(true);
                  }}
                  className="w-full text-left px-3 py-2 text-[14px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  Añadir nueva categoría
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Subcategoría */}
      {selectedParent && (
        <div className="space-y-1.5 h-[70px] mt-3 animate-fade-in">
          <label className="block text-[13px] font-bold text-slate-700">Subcategoría (Opcional)</label>
          
          {isCreatingChild ? (
            <div className="flex animate-fade-in items-center gap-2 bg-[#f4f4f4] rounded-2xl p-1.5 border border-[#d9d9d9] shadow-inner">
              <input
                autoFocus
                type="text"
                placeholder="Ej: Running..."
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveChild()}
                className="flex-1 bg-transparent px-3 py-2 text-[14px] font-medium text-slate-700 focus:outline-none"
                disabled={isSavingChild}
              />
              <button
                type="button"
                onClick={handleSaveChild}
                disabled={isSavingChild || !newChildName.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSavingChild ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => { setIsCreatingChild(false); setNewChildName(""); }}
                disabled={isSavingChild}
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <DashSelect
                searchable
                value={selectedChild}
                onChange={handleChildSelect}
                placeholder="Seleccionar subcategoría"
                emptyStateMessage="No hay subcategorías hijas"
                disabled={!selectedParent}
                options={[
                  ...availableSubcategories.map(c => ({ value: c.id, label: c.name }))
                ]}
                actionElement={
                  selectedParent ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreatingChild(true);
                      }}
                      className="w-full text-left px-3 py-2 text-[14px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" strokeWidth={3} />
                      Añadir nueva subcategoría
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
