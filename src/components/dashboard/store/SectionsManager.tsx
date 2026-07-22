"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Save, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSection } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DashToggle } from "@/components/dashboard/ui/DashToggle";

const SECTION_LABELS: Record<string, string> = {
  hero_banner: "Banner hero",
  featured_categories: "Categorias destacadas",
  featured_products: "Productos destacados",
  main_catalog: "Catalogo principal",
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

  const defaultVisibility = Object.fromEntries(
    DEFAULT_SECTIONS.map((section) => [section, true])
  );
  const sectionVisibility = { ...defaultVisibility };
  initialSections.forEach((section) => {
    sectionVisibility[section.section] = section.is_visible;
  });
  const [sections, setSections] = useState<Record<string, boolean>>(
    sectionVisibility
  );

  const initialOrder = DEFAULT_SECTIONS.map((key, index) => {
    const found = initialSections.find((section) => section.section === key);
    return { key, order: found?.sort_order ?? index };
  }).sort((a, b) => a.order - b.order);
  const [orderedSections, setOrderedSections] = useState(initialOrder);

  const toggleSection = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const nextOrder = [...orderedSections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextOrder.length) return;
    [nextOrder[index], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[index],
    ];
    setOrderedSections(nextOrder);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      for (let index = 0; index < orderedSections.length; index += 1) {
        const { key } = orderedSections[index];
        await supabase.from("store_sections_visibility").upsert(
          {
            store_id: store.id,
            section: key,
            is_visible: sections[key],
            sort_order: index,
          },
          { onConflict: "store_id,section" }
        );
      }

      toast.success("Secciones guardadas");
      router.refresh();
    } catch {
      toast.error("Error al guardar secciones");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Card className="border-brand-100 bg-brand-50/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Orden de la portada
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Activa o desactiva bloques y usa las flechas para cambiar el orden en que aparecen dentro de tu tienda.
            </p>
          </div>
        </div>
      </Card>

      <Card
        header={{
          title: "Bloques visibles",
          icon: <Layers className="h-5 w-5 text-emerald-600" />,
          action: <span className="text-xs text-slate-400">Usa las flechas para ordenar</span>,
        }}
      >
        <div className="space-y-3">
          {orderedSections.map((item, index) => (
            <div
              key={item.key}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-25"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, "down")}
                    disabled={index === orderedSections.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-25"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {SECTION_LABELS[item.key] || item.key}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {sections[item.key] ? "Visible en la tienda" : "Oculta por ahora"}
                  </p>
                </div>

                <DashToggle
                  checked={sections[item.key]}
                  onChange={() => toggleSection(item.key)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        onClick={handleSave}
        loading={saving}
        icon={<Save className="h-4 w-4" />}
        size="lg"
        className="w-full"
      >
        Guardar secciones
      </Button>
    </div>
  );
}
