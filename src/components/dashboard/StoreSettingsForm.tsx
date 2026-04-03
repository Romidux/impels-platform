"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Phone,
  Mail,
  DollarSign,
  Save,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Store as StoreType, StoreSettings } from "@/lib/types";
import { DashCard } from "@/components/dashboard/ui/DashCard";
import { DashButton } from "@/components/dashboard/ui/DashButton";
import {
  DashInput,
  DashTextarea,
  DashSelect,
} from "@/components/dashboard/ui/DashInput";

type StoreSettingsFormMode = "all" | "identity" | "commerce";

interface StoreSettingsFormProps {
  store: StoreType;
  settings?: StoreSettings;
  mode?: StoreSettingsFormMode;
}

export default function StoreSettingsForm({
  store,
  settings,
  mode = "all",
}: StoreSettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const [origin, setOrigin] = useState(
    process.env.NEXT_PUBLIC_APP_URL || "https://impels.com"
  );

  useEffect(() => {
    // Evitar hidratacion fallida usando el origen real solo en el cliente
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const showIdentity = mode === "all" || mode === "identity";
  const showCommerce = mode === "all" || mode === "commerce";

  const [form, setForm] = useState({
    name: store.name,
    description: store.description || "",
    currency: settings?.currency || "Gs",
    whatsapp_number: settings?.whatsapp_number || "",
    contact_email: settings?.contact_email || "",
    payment_methods: (
      settings?.payment_methods || ["Transferencia bancaria", "Contra entrega"]
    ).join(", "),
    shipping_methods: (
      settings?.shipping_methods || ["Delivery", "Retiro en tienda"]
    ).join(", "),
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      if (showIdentity) {
        const { error: storeError } = await supabase
          .from("stores")
          .update({
            name: form.name,
            description: form.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", store.id);

        if (storeError) throw storeError;
      }

      if (showCommerce) {
        const { error: settingsError } = await supabase
          .from("store_settings")
          .upsert(
            {
              store_id: store.id,
              currency: form.currency,
              whatsapp_number: form.whatsapp_number,
              contact_email: form.contact_email,
              payment_methods: form.payment_methods
                .split(",")
                .map((method) => method.trim())
                .filter(Boolean),
              shipping_methods: form.shipping_methods
                .split(",")
                .map((method) => method.trim())
                .filter(Boolean),
            },
            { onConflict: "store_id" }
          );

        if (settingsError) throw settingsError;
      }

      toast.success(
        mode === "identity"
          ? "Identidad guardada"
          : mode === "commerce"
          ? "Ventas y contacto guardados"
          : "Configuracion guardada"
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Error al guardar la configuracion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {showIdentity && (
        <DashCard
          header={{
            title: "Identidad de la tienda",
            icon: <Store className="h-5 w-5 text-emerald-600" />,
          }}
        >
          <div className="space-y-4">
            <DashInput
              label="Nombre de la tienda"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />

            <DashTextarea
              label="Descripcion"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder="Cuenta brevemente que vende tu tienda y que la hace especial."
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                URL publica
              </label>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <span className="block px-4 py-3 text-sm text-slate-500">
                  {`${origin}/store/${store.slug}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                El slug no puede cambiarse una vez creado.
              </p>
            </div>
          </div>
        </DashCard>
      )}

      {showCommerce && (
        <>
          <DashCard
            header={{
              title: "Contacto y pedidos",
              icon: <Phone className="h-5 w-5 text-emerald-600" />,
            }}
          >
            <div className="space-y-4">
              <DashInput
                label="Numero de WhatsApp"
                value={form.whatsapp_number}
                onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                placeholder="595991234567"
                hint="Usa el numero completo con codigo de pais."
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

          <DashCard
            header={{
              title: "Cobros y moneda",
              icon: <DollarSign className="h-5 w-5 text-amber-500" />,
            }}
          >
            <div className="space-y-4">
              <DashSelect
                label="Moneda de la tienda"
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                options={[
                  { value: "Gs", label: "Guaranies (Gs) - Paraguay" },
                  { value: "ARS", label: "Peso Argentino (ARS)" },
                  { value: "COP", label: "Peso Colombiano (COP)" },
                  { value: "MXN", label: "Peso Mexicano (MXN)" },
                  { value: "BRL", label: "Real Brasileno (BRL)" },
                  { value: "USD", label: "Dolar (USD)" },
                ]}
              />

              <DashInput
                label="Metodos de pago"
                icon={CreditCard}
                value={form.payment_methods}
                onChange={(e) => handleChange("payment_methods", e.target.value)}
                placeholder="Transferencia, Efectivo, Tarjeta..."
                hint="Escribe los metodos separados por comas."
              />

              <DashInput
                label="Metodos de envio o entrega"
                icon={ShoppingBag}
                value={form.shipping_methods}
                onChange={(e) => handleChange("shipping_methods", e.target.value)}
                placeholder="Delivery, Retiro en tienda..."
                hint="Escribe las opciones separadas por comas."
              />
            </div>
          </DashCard>
        </>
      )}

      <DashButton
        onClick={handleSave}
        loading={saving}
        icon={<Save className="h-4 w-4" />}
        size="lg"
        className="w-full"
      >
        {mode === "identity"
          ? "Guardar identidad"
          : mode === "commerce"
          ? "Guardar ventas y contacto"
          : "Guardar configuracion"}
      </DashButton>
    </div>
  );
}
