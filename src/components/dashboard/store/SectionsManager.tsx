"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Save, Eye, EyeOff, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSection } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashToggle } from "@/components/dashboard/ui/DashToggle";

const SECTION_LABELS: Record<string, string> = {
  hero_banner: "Banner Hero",
  featured_categories: "Categorías destacadas",
  featured_products: "Productos destacados",
  main_catalog: "Catálogo principal",
  promo_banner: "Banner promocional",
  recommended_products: "Productos recomendados",
};

const DEFAULT_SECTIONS = [
  "hero_banner",
  "featured_categories",
  "featured_products",
  "main_catalog",
  "promo_banner",
  "recommended_products",
];

interface SectionsManagerProps {
  store: Store;
  sections: StoreSection[];
}

export default function SectionsManager({
  store,
  sections: initialSections,
}: SectionsManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Build section state
  const defaultVisibility = Object.fromEntries(
    DEFAULT_SECTIONS.map((s) => [s, true])
  );
  const sectionVisibility = { ...defaultVisibility };
  initialSections.forEach((s) => {
    sectionVisibility[s.section] = s.is_visible;
  });
  const [sections, setSections] = useState<Record<string, boolean>>(
    sectionVisibility
  );

  // Build sort order
  const initialOrder = DEFAULT_SECTIONS.map((key, i) => {
    const found = initialSections.find((s) => s.section === key);
    return { key, order: found?.sort_order ?? i };
  }).sort((a, b) => a.order - b.order);
  const [orderedSections, setOrderedSections] = useState(initialOrder);

  const toggleSection = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Simple drag handler — move up/down
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...orderedSections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setOrderedSections(newOrder);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      for (let i = 0; i < orderedSections.length; i++) {
        const { key } = orderedSections[i];
        await supabase.from("store_sections_visibility").upsert(
          {
            store_id: store.id,
            section: key,
            is_visible: sections[key],
            sort_order: i,
          },
          { onConflict: "store_id,section" }
        );
      }

      toast.success("Secciones guardadas ✓");
      router.refresh();
    } catch {
      toast.error("Error al guardar secciones");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <DashCard
        header={{
          title: "Secciones de la tienda",
          icon: <Layers className="w-5 h-5 text-green-600" />,
          action: (
            <span className="text-xs text-slate-400">
              Arrastra para reordenar
            </span>
          ),
        }}
      >
        <div className="divide-y divide-gray-100">
          {orderedSections.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center gap-3 py-3.5"
            >
              {/* Reorder controls */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="w-5 h-5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 transition-colors text-xs"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === orderedSections.length - 1}
                  className="w-5 h-5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 transition-colors text-xs"
                >
                  ▼
                </button>
              </div>

              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

              <span className="text-sm font-medium text-slate-700 flex-1">
                {SECTION_LABELS[item.key] || item.key}
              </span>

              <DashToggle
                checked={sections[item.key]}
                onChange={() => toggleSection(item.key)}
              />
            </div>
          ))}
        </div>
      </DashCard>

      <DashButton
        onClick={handleSave}
        loading={saving}
        size="lg"
        className="w-full"
      >
        <Save className="w-4 h-4" />
        Guardar secciones
      </DashButton>
    </div>
  );
}
