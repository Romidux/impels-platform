"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  DollarSign,
  Save,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store as StoreType, StoreSettings } from "@/lib/types";

interface StoreSettingsFormProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function StoreSettingsForm({
  store,
  settings,
}: StoreSettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // Store
    name: store.name,
    description: store.description || "",
    // Settings
    currency: settings?.currency || "Gs",
    whatsapp_number: settings?.whatsapp_number || "",
    contact_email: settings?.contact_email || "",
    instagram_url: settings?.instagram_url || "",
    facebook_url: settings?.facebook_url || "",
    tiktok_url: settings?.tiktok_url || "",
    twitter_url: settings?.twitter_url || "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Update store name/description
      const { error: storeError } = await supabase
        .from("stores")
        .update({ name: form.name, description: form.description, updated_at: new Date().toISOString() })
        .eq("id", store.id);
      if (storeError) throw storeError;

      // Upsert store settings
      const { error: settingsError } = await supabase
        .from("store_settings")
        .upsert(
          {
            store_id: store.id,
            currency: form.currency,
            whatsapp_number: form.whatsapp_number,
            contact_email: form.contact_email,
            instagram_url: form.instagram_url,
            facebook_url: form.facebook_url,
            tiktok_url: form.tiktok_url,
            twitter_url: form.twitter_url,
          },
          { onConflict: "store_id" }
        );
      if (settingsError) throw settingsError;

      toast.success("Configuración guardada ✓");
      router.refresh();
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Configuración
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los datos principales de tu tienda
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar
        </button>
      </div>

      {/* Store info */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-500" />
          Información de la tienda
        </h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nombre de la tienda
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            placeholder="Describe tu tienda..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            URL de la tienda
          </label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <span className="text-gray-400 text-sm px-4 flex items-center border-r border-gray-200">
              impels-platform.vercel.app/store/
            </span>
            <span className="px-4 py-3 text-sm text-gray-500">
              {store.slug}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            El slug no puede cambiarse una vez creado.
          </p>
        </div>
      </div>

      {/* Contact & WhatsApp */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-500" />
          Contacto y pedidos
        </h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Número de WhatsApp
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              +
            </span>
            <input
              type="tel"
              value={form.whatsapp_number}
              onChange={(e) =>
                handleChange("whatsapp_number", e.target.value)
              }
              placeholder="595991234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-7 text-sm focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Número completo con código de país (ej: 595991234567)
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email de contacto
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) =>
                handleChange("contact_email", e.target.value)
              }
              placeholder="contacto@milienda.com"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-500" />
          Moneda
        </h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Moneda de la tienda
          </label>
          <select
            value={form.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
          >
            <option value="Gs">Guaraníes (Gs) — Paraguay</option>
            <option value="ARS">Peso Argentino (ARS)</option>
            <option value="COP">Peso Colombiano (COP)</option>
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="BRL">Real Brasileño (BRL)</option>
            <option value="USD">Dólar (USD)</option>
          </select>
        </div>
      </div>

      {/* Social Media */}
      <div className="card-flat p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" />
          Redes sociales
        </h2>

        {[
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
        ].map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {label}
            </label>
            <div className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        ))}
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
        Guardar configuración
      </button>
    </div>
  );
}
