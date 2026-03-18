"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Save,
  Instagram,
  Facebook,
  Twitter,
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
      // Save social links to store_settings
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

      // Save footer labels to branding
      await supabase.from("store_branding").upsert(
        {
          store_id: store.id,
          footer_categories_label: form.footer_categories_label,
          footer_contact_label: form.footer_contact_label,
        },
        { onConflict: "store_id" }
      );

      toast.success("Footer y redes guardados ✓");
      router.refresh();
    } catch {
      toast.error("Error al guardar");
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
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Social Links */}
      <DashCard header={{ title: "Redes sociales", icon: <Globe className="w-5 h-5 text-green-600" /> }}>
        <div className="space-y-4">
          {socialFields.map(({ key, label, icon, placeholder }) => (
            <DashInput
              key={key}
              label={label}
              icon={icon}
              value={form[key as keyof typeof form]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              type="url"
            />
          ))}
        </div>
      </DashCard>

      {/* Footer Content */}
      <DashCard
          icon: <Globe className="w-5 h-5 text-purple-500" />,
      >
        <div className="space-y-4">
          <DashInput
            label="Título sección categorías"
            value={form.footer_categories_label}
            onChange={(e) =>
              handleChange("footer_categories_label", e.target.value)
            }
            placeholder="Categorías"
            hint="Título que aparece en la columna de categorías del footer"
          />
          <DashInput
            label="Título sección contacto"
            value={form.footer_contact_label}
            onChange={(e) =>
              handleChange("footer_contact_label", e.target.value)
            }
            placeholder="Contacto"
            hint="Título que aparece en la columna de contacto del footer"
          />
        </div>
      </DashCard>

      <DashButton
        onClick={handleSave}
        loading={saving}
        size="lg"
        className="w-full"
      >
        <Save className="w-4 h-4" />
        Guardar footer y redes
      </DashButton>
    </div>
  );
}
