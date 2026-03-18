"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Save, Type, Image } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings, StoreBranding } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashInput, DashTextarea } from "@/components/dashboard/ui/DashInput";

interface HomepageManagerProps {
  store: Store;
  settings?: StoreSettings;
  branding?: StoreBranding;
}

export default function HomepageManager({
  store,
  settings,
  branding,
}: HomepageManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [heroTitle, setHeroTitle] = useState(settings?.hero_title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(
    settings?.hero_subtitle || ""
  );
  const [promoBannerTitle, setPromoBannerTitle] = useState(
    branding?.promo_banner_title || ""
  );
  const [promoBannerSubtitle, setPromoBannerSubtitle] = useState(
    branding?.promo_banner_subtitle || ""
  );
  const [promoBannerCta, setPromoBannerCta] = useState(
    branding?.promo_banner_cta || ""
  );
  const [promoBannerUrlLink, setPromoBannerUrlLink] = useState(
    branding?.promo_banner_url_link || ""
  );

  useEffect(() => {
    if (settings) {
      setHeroTitle(settings.hero_title || "");
      setHeroSubtitle(settings.hero_subtitle || "");
    }
    if (branding) {
      setPromoBannerTitle(branding.promo_banner_title || "");
      setPromoBannerSubtitle(branding.promo_banner_subtitle || "");
      setPromoBannerCta(branding.promo_banner_cta || "");
      setPromoBannerUrlLink(branding.promo_banner_url_link || "");
    }
  }, [settings, branding]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Update hero text in settings
      await supabase.from("store_settings").upsert(
        {
          store_id: store.id,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
        },
        { onConflict: "store_id" }
      );

      // Update promo banner in branding
      await supabase.from("store_branding").upsert(
        {
          store_id: store.id,
          promo_banner_title: promoBannerTitle,
          promo_banner_subtitle: promoBannerSubtitle,
          promo_banner_cta: promoBannerCta,
          promo_banner_url_link: promoBannerUrlLink,
        },
        { onConflict: "store_id" }
      );

      toast.success("Página de inicio guardada ✓");
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const previewColor = settings?.primary_color || "#166534";

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Hero text */}
      <DashCard header={{ title: "Hero de la tienda", icon: <Type className="w-5 h-5 text-green-600" /> }}>
        <div className="space-y-4">
          <DashInput
            label="Título principal"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder={`Bienvenidos a ${store.name}`}
          />
          <DashInput
            label="Subtítulo"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Los mejores productos al mejor precio"
          />
        </div>

        {/* Live Preview */}
        <div className="mt-5 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <div className="px-8 py-10 text-center">
            <h3 className="font-display text-xl font-bold text-slate-900">
              {heroTitle || `Bienvenidos a ${store.name}`}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {heroSubtitle || "Los mejores productos al mejor precio"}
            </p>
            <button
              className="text-white text-sm font-semibold px-5 py-2 rounded-lg"
              style={{ backgroundColor: previewColor }}
            >
              Ver catálogo
            </button>
          </div>
        </div>
      </DashCard>

      {/* Promo Banner */}
      <DashCard
        header={{ title: "Banner promocional", icon: <Image className="w-5 h-5 text-purple-500" /> }}
      >
        <div className="space-y-4">
          <DashInput
            label="Título del banner"
            value={promoBannerTitle}
            onChange={(e) => setPromoBannerTitle(e.target.value)}
            placeholder="¡Oferta especial!"
          />
          <DashInput
            label="Subtítulo"
            value={promoBannerSubtitle}
            onChange={(e) => setPromoBannerSubtitle(e.target.value)}
            placeholder="Hasta 50% de descuento"
          />
          <div className="grid grid-cols-2 gap-4">
            <DashInput
              label="Texto del botón (CTA)"
              value={promoBannerCta}
              onChange={(e) => setPromoBannerCta(e.target.value)}
              placeholder="Comprar ahora"
            />
            <DashInput
              label="URL del botón"
              value={promoBannerUrlLink}
              onChange={(e) => setPromoBannerUrlLink(e.target.value)}
              placeholder="/store/tu-tienda"
            />
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
        Guardar página de inicio
      </DashButton>
    </div>
  );
}
