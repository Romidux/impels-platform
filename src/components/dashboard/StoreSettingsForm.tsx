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
  Check,
  X,
  Plus,
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
import { PhoneInput } from "@/components/ui/PhoneInput";
import { cn } from "@/lib/utils";

type StoreSettingsFormMode = "all" | "identity" | "commerce";

interface StoreSettingsFormProps {
  store: StoreType;
  settings?: StoreSettings;
  mode?: StoreSettingsFormMode;
}

const PAYMENT_OPTIONS = [
  "Efectivo",
  "Transferencia",
  "Tarjeta",
  "Giro / Billetera",
  "A convenir",
];

const SHIPPING_OPTIONS = [
  "Delivery",
  "Retiro en tienda",
  "Envío por transportadora",
  "A convenir",
];

function parseMethodsArray(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // legacy string fallback
  return (value as string).split(",").map((s) => s.trim()).filter(Boolean);
}

interface MethodSelectorProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}

function MethodSelector({ label, icon, options, selected, onChange, hint }: MethodSelectorProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setCustomInput("");
  };

  const removeCustom = (opt: string) => {
    onChange(selected.filter((s) => s !== opt));
  };

  const customItems = selected.filter((s) => !options.includes(s));

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {label}
      </label>

      {/* Predefined toggleable pills */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all duration-150 select-none",
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {active && <Check className="w-3 h-3 shrink-0" />}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Custom items as dismissible chips */}
      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customItems.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-100"
            >
              {item}
              <button
                type="button"
                onClick={() => removeCustom(item)}
                className="hover:text-blue-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom option */}
      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Otro método..."
          className="dash-input flex-1 text-sm py-2"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
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
    payment_methods: parseMethodsArray(settings?.payment_methods),
    shipping_methods: parseMethodsArray(settings?.shipping_methods),
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
              payment_methods: form.payment_methods,
              shipping_methods: form.shipping_methods,
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Numero de WhatsApp
                </label>
                <PhoneInput
                  value={form.whatsapp_number}
                  onChange={(val) => handleChange("whatsapp_number", val)}
                  placeholder="981 234 567"
                  hint="El numero completo se guarda automaticamente con el prefijo."
                />
              </div>
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
            <div className="space-y-6">
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

              <div className="h-px bg-slate-100" />

              <MethodSelector
                label="Métodos de pago"
                icon={<CreditCard className="w-4 h-4 text-slate-400" />}
                options={PAYMENT_OPTIONS}
                selected={form.payment_methods}
                onChange={(next) => setForm((prev) => ({ ...prev, payment_methods: next }))}
                hint="Seleccioná los métodos que aceptás. Los clientes verán estas opciones al pagar."
              />

              <div className="h-px bg-slate-100" />

              <MethodSelector
                label="Métodos de envío o entrega"
                icon={<ShoppingBag className="w-4 h-4 text-slate-400" />}
                options={SHIPPING_OPTIONS}
                selected={form.shipping_methods}
                onChange={(next) => setForm((prev) => ({ ...prev, shipping_methods: next }))}
                hint="Seleccioná las modalidades de entrega disponibles en tu tienda."
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
