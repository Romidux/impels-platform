"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Eye, EyeOff, Save, Layers, Type, Zap, Instagram, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings, StoreBranding, StoreSection } from "@/lib/types";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal Store",
    description: "Estricto blanco y negro. Hero minimalista y elegante.",
    preview: "bg-white border-gray-200",
  },
  {
    id: "modern",
    name: "Modern Commerce",
    description: "Moderno y dinámico. Ideal para tiendas de moda y tech.",
    preview: "bg-gradient-to-br from-blue-600 to-purple-700",
  },
  {
    id: "brand",
    name: "Brand Focused",
    description: "Tu marca al frente. Colores y logo prominentes.",
    preview: "bg-gradient-to-br from-pink-500 to-orange-500",
  },
];

const SECTIONS = [
  { key: "hero_banner", label: "Banner Hero" },
  { key: "featured_categories", label: "Categorías destacadas" },
  { key: "featured_products", label: "Productos destacados" },
  { key: "main_catalog", label: "Catálogo principal" },
  { key: "promo_banner", label: "Banner promocional" },
  { key: "recommended_products", label: "Productos recomendados" },
];

interface AppearanceManagerProps {
  store: Store;
  settings?: StoreSettings;
  branding?: StoreBranding;
  sections: StoreSection[];
}

export default function AppearanceManager({
  store,
  settings,
  branding,
  sections: initialSections,
}: AppearanceManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(settings?.template || "modern");
  const [primaryColor, setPrimaryColor] = useState(
    settings?.primary_color || "#2563eb"
  );
  const [heroTitle, setHeroTitle] = useState(settings?.hero_title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(
    settings?.hero_subtitle || ""
  );
  const [benefits, setBenefits] = useState<string[]>(
    settings?.benefits_bar_items || [
      "ENVÍOS A TODO EL PAÍS",
      "ATENCIÓN POR WHATSAPP",
      "PAGO SEGURO",
      "PRODUCTOS ORIGINALES",
    ]
  );
  
  // Footer Labels
  const [footerCategoriesLabel, setFooterCategoriesLabel] = useState(branding?.footer_categories_label || "Productos");
  const [footerContactLabel, setFooterContactLabel] = useState(branding?.footer_contact_label || "Contacto");
  const [instagramUrl, setInstagramUrl] = useState(settings?.instagram_url || "");

  // Build section visibility state from DB data
  const defaultVisibility = Object.fromEntries(
    SECTIONS.map((s) => [s.key, true])
  );
  const sectionVisibility = { ...defaultVisibility };
  initialSections.forEach((s) => {
    sectionVisibility[s.section] = s.is_visible;
  });
  const [sections, setSections] = useState<Record<string, boolean>>(
    sectionVisibility
  );

  const toggleSection = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (store.plan === "free" && template !== "minimal") {
      toast.error("Los templates premium requieren plan Pro");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // Update settings
      const { error: settingsError } = await supabase.from("store_settings").upsert(
        {
          id: settings?.id,
          store_id: store.id,
          template,
          primary_color: template === "minimal" ? "#000000" : primaryColor,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          benefits_bar_items: benefits,
          instagram_url: instagramUrl,
        },
        { onConflict: "store_id" }
      );
      if (settingsError) throw settingsError;

      // Update branding (for footer labels)
      const { error: brandingError } = await supabase.from("store_branding").upsert(
        {
          id: branding?.id,
          store_id: store.id,
          footer_categories_label: footerCategoriesLabel,
          footer_contact_label: footerContactLabel,
        },
        { onConflict: "store_id" }
      );
      if (brandingError) throw brandingError;

      // Upsert section visibility
      for (const [key, visible] of Object.entries(sections)) {
        const { error: sectionError } = await supabase.from("store_sections_visibility").upsert(
          {
            store_id: store.id,
            section: key,
            is_visible: visible,
          },
          { onConflict: "store_id,section" }
        );
        if (sectionError) throw sectionError;
      }

      toast.success("Apariencia guardada ✓");
      router.refresh();
    } catch (error) {
      console.error("Error saving appearance:", error);
      toast.error("Error al guardar la apariencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Apariencia
          </h1>
          <p className="text-gray-500 mt-1">
            Personaliza el estilo visual de tu tienda
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar
        </button>
      </div>

      {/* Template selection */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          Template de tienda
        </h2>
        <div className="grid grid-cols-3 gap-4">
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
                className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                  template === t.id
                    ? "border-blue-500 shadow-glow"
                    : "border-gray-200 hover:border-gray-300"
                } ${locked ? "opacity-60" : ""}`}
              >
                <div className={`h-20 ${t.preview}`} />
                <div className="p-3 text-left">
                  <p className="font-semibold text-sm text-gray-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {t.description}
                  </p>
                </div>
                {locked && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Pro
                  </div>
                )}
                {template === t.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-500" />
          Colores
        </h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={template === "minimal" ? "#000000" : primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={template === "minimal"}
                className={`w-12 h-12 rounded-xl border border-gray-200 cursor-pointer ${
                  template === "minimal" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <div>
                <p className="text-sm font-mono text-gray-600">
                  {template === "minimal" ? "#000000" : primaryColor}
                </p>
                <p className="text-xs text-gray-400">
                  {template === "minimal"
                    ? "El template minimal solo usa Blanco y Negro"
                    : "Botones, links y acentos"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Quick color presets */}
        {template !== "minimal" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Colores rápidos
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                "#2563eb",
                "#7c3aed",
                "#dc2626",
                "#16a34a",
                "#ea580c",
                "#0891b2",
                "#db2777",
                "#0f172a",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                    primaryColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hero text */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Type className="w-5 h-5 text-blue-500" />
          Texto del Hero
        </h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Título principal
          </label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder={`Bienvenidos a ${store.name}`}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
            <span>Subtítulo / Descripción Hero</span>
            <span className={`text-[10px] ${heroSubtitle.length > 120 ? "text-red-500" : "text-gray-400"}`}>
              {heroSubtitle.length}/120
            </span>
          </label>
          <input
            type="text"
            maxLength={120}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Los mejores productos al mejor precio"
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
               heroSubtitle.length > 120 ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-blue-400"
            }`}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            En el template Minimal se mostrarán máximo 2 líneas.
          </p>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Barra de beneficios (Marquee)
        </h2>
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => {
                  const newBenefits = [...benefits];
                  newBenefits[index] = e.target.value;
                  setBenefits(newBenefits);
                }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                placeholder="Ej: Envíos gratis"
              />
              <button
                onClick={() => {
                  setBenefits(benefits.filter((_, i) => i !== index));
                }}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setBenefits([...benefits, ""])}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-all"
          >
            + Agregar beneficio
          </button>
        </div>
      </div>

      {/* Footer Labels (Minimal only) */}
      {template === "minimal" && (
        <div className="card-flat p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Personalización del Footer
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Etiqueta Categorías
              </label>
              <input
                type="text"
                value={footerCategoriesLabel}
                onChange={(e) => setFooterCategoriesLabel(e.target.value)}
                placeholder="Ej: Explorar o Colecciones"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Etiqueta Contacto
              </label>
              <input
                type="text"
                value={footerContactLabel}
                onChange={(e) => setFooterContactLabel(e.target.value)}
                placeholder="Ej: Ayuda o Soporte"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Redes Sociales */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-500" />
          Redes Sociales
        </h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            URL de Instagram
          </label>
          <input
            type="text"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/tu_usuario"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Ingresa el enlace completo a tu perfil de Instagram.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-500" />
          Secciones de la tienda
        </h2>
        <div className="divide-y divide-gray-100">
          {SECTIONS.map((section) => (
            <div
              key={section.key}
              className="flex items-center justify-between py-3"
            >
              <span className="text-sm font-medium text-gray-700">
                {section.label}
              </span>
              <button
                onClick={() => toggleSection(section.key)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                  sections[section.key]
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                {sections[section.key] ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Oculta
                  </>
                )}
                <div
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    sections[section.key] ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      sections[section.key] ? "translate-x-5" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 gradient-brand text-white font-bold py-4 rounded-2xl hover:shadow-glow transition-all disabled:opacity-50"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        Guardar apariencia
      </button>
    </div>
  );
}
