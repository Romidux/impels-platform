"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, Save, Layers, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Catalogo limpio y directo, ideal para mostrar productos sin distracciones.",
    preview: "bg-gradient-to-br from-slate-100 via-white to-slate-200",
    accent: "border-slate-200",
    tier: "Gratis",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Mas dinamico y visual, pensado para tiendas con una marca mas protagonista.",
    preview: "bg-gradient-to-br from-blue-600 to-violet-600",
    accent: "border-blue-200",
    tier: "Pro",
  },
  {
    id: "brand",
    name: "Brand",
    description: "Mayor enfasis en identidad visual y mensajes de portada mas marcados.",
    preview: "bg-gradient-to-br from-rose-500 to-orange-500",
    accent: "border-rose-200",
    tier: "Pro",
  },
] as const;

const COLOR_PRESETS = [
  "#166534",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#0f172a",
  "#16a34a",
  "#ca8a04",
];

interface ThemeManagerProps {
  store: Store;
  settings?: StoreSettings;
}

export default function ThemeManager({ store, settings }: ThemeManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [template, setTemplate] = useState(settings?.template || "modern");
  const [primaryColor, setPrimaryColor] = useState(
    settings?.primary_color || "#2563eb"
  );

  useEffect(() => {
    if (settings) {
      setTemplate(settings.template || "modern");
      setPrimaryColor(settings.primary_color || "#2563eb");
    }
  }, [settings]);

  const handleSave = async () => {
    if (store.plan === "free" && template !== "minimal") {
      toast.error("Los templates premium requieren plan Pro");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      await supabase.from("store_settings").upsert(
        {
          store_id: store.id,
          template,
          primary_color: primaryColor,
        },
        { onConflict: "store_id" }
      );

      toast.success("Apariencia guardada");
      router.refresh();
    } catch {
      toast.error("Error al guardar la apariencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <DashCard className="border-brand-100 bg-brand-50/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Capa visual base
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              En esta etapa puedes definir el template base y el color principal.
              Luego ajustas portada, secciones y textos en las siguientes capas.
            </p>
          </div>
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Template base",
          icon: <Layers className="h-5 w-5 text-emerald-600" />,
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TEMPLATES.map((templateOption) => {
            const locked = templateOption.tier === "Pro" && store.plan === "free";
            const isSelected = template === templateOption.id;

            return (
              <button
                key={templateOption.id}
                type="button"
                onClick={() => {
                  if (locked) {
                    toast.error("Requiere plan Pro");
                    return;
                  }
                  setTemplate(templateOption.id);
                }}
                className={`relative overflow-hidden rounded-[24px] border bg-white text-left transition-all ${
                  isSelected
                    ? "border-brand-300 shadow-[0_12px_32px_rgba(37,99,235,0.14)]"
                    : `border-slate-200 hover:border-slate-300 ${templateOption.accent}`
                } ${locked ? "opacity-75" : ""}`}
              >
                <div className={`h-24 ${templateOption.preview}`} />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-lg font-bold text-slate-900">
                      {templateOption.name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                        templateOption.tier === "Pro"
                          ? "bg-brand-50 text-brand-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {templateOption.tier}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {templateOption.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Color principal",
          icon: <Palette className="h-5 w-5 text-violet-600" />,
        }}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-14 w-14 cursor-pointer rounded-2xl border border-slate-200 bg-white"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {primaryColor}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Este color se usa en botones, enlaces y acentos principales.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Presets rapidos
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimaryColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-9 w-9 rounded-xl transition-transform hover:scale-105 ${
                    primaryColor === color
                      ? "ring-2 ring-brand-300 ring-offset-2"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </DashCard>

      <DashButton
        onClick={handleSave}
        loading={saving}
        size="lg"
        className="w-full"
      >
        <Save className="h-4 w-4" />
        Guardar apariencia
      </DashButton>
    </div>
  );
}
