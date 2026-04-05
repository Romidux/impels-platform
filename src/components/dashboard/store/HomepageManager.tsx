"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Save, Type, Image, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings, StoreBranding } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashInput } from "@/components/dashboard/ui/DashInput";

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
      await supabase.from("store_settings").upsert(
        {
          store_id: store.id,
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
        },
        { onConflict: "store_id" }
      );

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

      toast.success("Portada guardada");
      router.refresh();
    } catch {
      toast.error("Error al guardar la portada");
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
              Mensaje de portada
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Aqui controlas el primer impacto de tu tienda: el texto principal de bienvenida y el banner promocional.
            </p>
          </div>
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Hero principal",
          icon: <Type className="h-5 w-5 text-emerald-600" />,
        }}
      >
        <div className="space-y-4">
          <DashInput
            label="Titulo principal"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder={`Bienvenidos a ${store.name}`}
          />
          <DashInput
            label="Subtitulo"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Presenta tu propuesta de valor en una frase clara."
          />
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Banner promocional",
          icon: <Image className="h-5 w-5 text-violet-600" />,
        }}
      >
        <div className="space-y-4">
          <DashInput
            label="Titulo del banner"
            value={promoBannerTitle}
            onChange={(e) => setPromoBannerTitle(e.target.value)}
            placeholder="Oferta especial"
          />
          <DashInput
            label="Subtitulo"
            value={promoBannerSubtitle}
            onChange={(e) => setPromoBannerSubtitle(e.target.value)}
            placeholder="Resume la promocion o mensaje que quieres destacar."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DashInput
              label="Texto del boton"
              value={promoBannerCta}
              onChange={(e) => setPromoBannerCta(e.target.value)}
              placeholder="Comprar ahora"
            />
            <DashInput
              label="URL del boton"
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
        variant="primarySolid"
        size="lg"
        className="w-full"
      >
        <Save className="h-4 w-4" />
        Guardar portada
      </DashButton>
    </div>
  );
}
