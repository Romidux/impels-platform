"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Phone,
  Mail,
  DollarSign,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store as StoreType, StoreSettings } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import { DashInput, DashTextarea, DashSelect } from "@/components/dashboard/ui/DashInput";

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
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: store.name,
    description: store.description || "",
    currency: settings?.currency || "Gs",
    whatsapp_number: settings?.whatsapp_number || "",
    contact_email: settings?.contact_email || "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      const { error: storeError } = await supabase
        .from("stores")
        .update({
          name: form.name,
          description: form.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);
      if (storeError) throw storeError;

      const { error: settingsError } = await supabase
        .from("store_settings")
        .upsert(
          {
            store_id: store.id,
            currency: form.currency,
            whatsapp_number: form.whatsapp_number,
            contact_email: form.contact_email,
          },
          { onConflict: "store_id" }
        );
      if (settingsError) throw settingsError;

      toast.success("Configuración guardada ✓");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Store info */}
      <DashCard header={{ title: "Información de la tienda", icon: <Store className="w-5 h-5 text-green-600" /> }}>
        <div className="space-y-4">
          <DashInput
            label="Nombre de la tienda"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <DashTextarea
            label="Descripción"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            placeholder="Describe tu tienda..."
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              URL de la tienda
            </label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <span className="text-slate-400 text-sm px-4 flex items-center border-r border-gray-200 whitespace-nowrap">
                impels-platform.vercel.app/store/
              </span>
              <span className="px-4 py-2.5 text-sm text-slate-500">
                {store.slug}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              El slug no puede cambiarse una vez creado.
            </p>
          </div>
        </div>
      </DashCard>

      {/* Contact & WhatsApp */}
      <DashCard
        header={{
          title: "Contacto y pedidos",
          icon: <Phone className="w-5 h-5 text-green-600" />,
        }}
      >
        <div className="space-y-4">
          <DashInput
            label="Número de WhatsApp"
            value={form.whatsapp_number}
            onChange={(e) => handleChange("whatsapp_number", e.target.value)}
            placeholder="595991234567"
            hint="Número completo con código de país (ej: 595991234567)"
            type="tel"
          />
          <DashInput
            label="Email de contacto"
            icon={Mail}
            value={form.contact_email}
            onChange={(e) => handleChange("contact_email", e.target.value)}
            placeholder="contacto@mitienda.com"
            type="email"
          />
        </div>
      </DashCard>

      {/* Currency */}
      <DashCard
        header={{
          title: "Moneda",
          icon: <DollarSign className="w-5 h-5 text-amber-500" />,
        }}
      >
        <DashSelect
          label="Moneda de la tienda"
          value={form.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
          options={[
            { value: "Gs", label: "Guaraníes (Gs) — Paraguay" },
            { value: "ARS", label: "Peso Argentino (ARS)" },
            { value: "COP", label: "Peso Colombiano (COP)" },
            { value: "MXN", label: "Peso Mexicano (MXN)" },
            { value: "BRL", label: "Real Brasileño (BRL)" },
            { value: "USD", label: "Dólar (USD)" },
          ]}
        />
      </DashCard>

      <DashButton
        onClick={handleSave}
        loading={saving}
        icon={<Save className="w-4 h-4" />}
        size="lg"
        className="w-full"
      >
        Guardar configuración
      </DashButton>
    </div>
  );
}
