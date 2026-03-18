"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, Save, Layers, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal Catalog",
    description: "Limpio y ordenado. Catálogo con foco en los productos.",
    preview: "bg-gradient-to-br from-gray-100 to-gray-200",
    previewText: "text-gray-800",
  },
  {
    id: "modern",
    name: "Modern Commerce",
    description: "Moderno y dinámico. Ideal para tiendas de moda y tech.",
    preview: "bg-gradient-to-br from-blue-600 to-purple-700",
    previewText: "text-white",
  },
  {
    id: "brand",
    name: "Brand Focused",
    description: "Tu marca al frente. Colores y logo prominentes.",
    preview: "bg-gradient-to-br from-pink-500 to-orange-500",
    previewText: "text-white",
  },
];

const COLOR_PRESETS = [
  "#166534", "#2563eb", "#7c3aed", "#dc2626", "#ea580c",
  "#0891b2", "#db2777", "#0f172a", "#16a34a", "#ca8a04",
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

      toast.success("Tema guardado ✓");
      router.refresh();
    } catch {
      toast.error("Error al guardar el tema");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Template selection */}
      <DashCard
        header={{ title: "Template de tienda", icon: <Layers className="w-5 h-5 text-green-600" /> }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => {
            const isPro = t.id !== "minimal";
            const locked = isPro && store.plan === "free";
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (locked) {
                    toast.error("Requiere plan Pro");
                    return;
                  }
                  setTemplate(t.id as "minimal" | "modern" | "brand");
                }}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  template === t.id
                    ? "border-green-600 shadow-dash-glow"
                    : "border-gray-200 hover:border-gray-300"
                } ${locked ? "opacity-60" : ""}`}
              >
                <div className={`h-20 ${t.preview}`} />
                <div className="p-3">
                  <p className="font-semibold text-sm text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {t.description}
                  </p>
                </div>
                {locked && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Pro
                  </div>
                )}
                {template === t.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DashCard>

      {/* Colors */}
      <DashCard header={{ title: "Colores", icon: <Palette className="w-5 h-5 text-green-600" /> }}>
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Color principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
              />
              <div>
                <p className="text-sm font-mono text-slate-600">
                  {primaryColor}
                </p>
                <p className="text-xs text-slate-400">
                  Botones, links y acentos
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Colores rápidos
          </p>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                  primaryColor === color
                    ? "ring-2 ring-offset-2 ring-green-400"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>
      </DashCard>

      {/* Live Preview */}
      <DashCard header={{ title: "Vista previa", icon: <Palette className="w-5 h-5 text-purple-500" /> }}>
        <div className="rounded-xl overflow-hidden border border-gray-200">
          {/* Mock storefront header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white font-bold text-sm">{store.name}</span>
            <div className="flex gap-4">
              <span className="text-white/70 text-xs">Inicio</span>
              <span className="text-white/70 text-xs">Catálogo</span>
              <span className="text-white/70 text-xs">Contacto</span>
            </div>
          </div>
          {/* Mock hero */}
          <div className="bg-gray-50 px-8 py-10 text-center">
            <h3 className="font-display text-xl font-bold text-slate-900">
              Bienvenido a {store.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Los mejores productos al mejor precio
            </p>
            <button
              className="text-white text-sm font-semibold px-5 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Ver catálogo
            </button>
          </div>
          {/* Mock products */}
          <div className="p-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="h-16 bg-gray-100" />
                <div className="p-2">
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                  <div
                    className="h-2 rounded w-1/2"
                    style={{ backgroundColor: `${primaryColor}30` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashCard>

      <DashButton
        onClick={handleSave}
        loading={saving}
        size="lg"
        className="w-full"
      >
        <Save className="w-4 h-4" />
        Guardar tema
      </DashButton>
    </div>
  );
}
