"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Save,
  Instagram,
  Facebook,
  Twitter,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store, StoreSettings, StoreBranding } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashInput } from "@/components/dashboard/ui/DashInput";

interface FooterSocialManagerProps {
  store: Store;
  settings?: StoreSettings;
  branding?: StoreBranding;
}

export default function FooterSocialManager({
  store,
  settings,
  branding,
}: FooterSocialManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    instagram_url: settings?.instagram_url || "",
    facebook_url: settings?.facebook_url || "",
    tiktok_url: settings?.tiktok_url || "",
    twitter_url: settings?.twitter_url || "",
    footer_categories_label: branding?.footer_categories_label || "",
    footer_contact_label: branding?.footer_contact_label || "",
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        instagram_url: settings.instagram_url || "",
        facebook_url: settings.facebook_url || "",
        tiktok_url: settings.tiktok_url || "",
        twitter_url: settings.twitter_url || "",
      }));
    }
    if (branding) {
      setForm((prev) => ({
        ...prev,
        footer_categories_label: branding.footer_categories_label || "",
        footer_contact_label: branding.footer_contact_label || "",
      }));
    }
  }, [settings, branding]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      await supabase.from("store_settings").upsert(
        {
          store_id: store.id,
          instagram_url: form.instagram_url,
          facebook_url: form.facebook_url,
          tiktok_url: form.tiktok_url,
          twitter_url: form.twitter_url,
        },
        { onConflict: "store_id" }
      );

      await supabase.from("store_branding").upsert(
        {
          store_id: store.id,
          footer_categories_label: form.footer_categories_label,
          footer_contact_label: form.footer_contact_label,
        },
        { onConflict: "store_id" }
      );

      toast.success("Footer y redes guardados");
      router.refresh();
    } catch {
      toast.error("Error al guardar footer y redes");
    } finally {
      setSaving(false);
    }
  };

  const socialFields = [
    {
      key: "instagram_url",
      label: "Instagram",
      icon: Instagram,
      placeholder: "https://instagram.com/tutienda",
    },
    {
      key: "facebook_url",
      label: "Facebook",
      icon: Facebook,
      placeholder: "https://facebook.com/tutienda",
    },
    {
      key: "tiktok_url",
      label: "TikTok",
      icon: Globe,
      placeholder: "https://tiktok.com/@tutienda",
    },
    {
      key: "twitter_url",
      label: "X / Twitter",
      icon: Twitter,
      placeholder: "https://x.com/tutienda",
    },
  ] as const;

  return (
    <div className="max-w-3xl space-y-5">
      <DashCard className="border-brand-100 bg-brand-50/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Cierre de marca
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Completa tus redes y los textos del footer para que tu tienda se vea mas consistente y profesional.
            </p>
          </div>
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Redes sociales",
          icon: <Globe className="h-5 w-5 text-emerald-600" />,
        }}
      >
        <div className="space-y-4">
          {socialFields.map(({ key, label, icon, placeholder }) => (
            <DashInput
              key={key}
              label={label}
              icon={icon}
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              type="url"
            />
          ))}
        </div>
      </DashCard>

      <DashCard
        header={{
          title: "Textos del footer",
          icon: <Globe className="h-5 w-5 text-violet-600" />,
        }}
      >
        <div className="space-y-4">
          <DashInput
            label="Titulo de categorias"
            value={form.footer_categories_label}
            onChange={(e) =>
              handleChange("footer_categories_label", e.target.value)
            }
            placeholder="Categorias"
            hint="Titulo que aparece en la columna de categorias del footer."
          />
          <DashInput
            label="Titulo de contacto"
            value={form.footer_contact_label}
            onChange={(e) =>
              handleChange("footer_contact_label", e.target.value)
            }
            placeholder="Contacto"
            hint="Titulo que aparece en la columna de contacto del footer."
          />
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
        Guardar footer y redes
      </DashButton>
    </div>
  );
}
