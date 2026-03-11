"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import {
  Zap,
  Store,
  Phone,
  ArrowRight,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const STEPS = ["Tu tienda", "WhatsApp", "¡Listo!"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    whatsapp: "",
    currency: "Gs",
  });

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);

      // Check if user already has a store → go to dashboard
      supabase
        .from("stores")
        .select("id")
        .eq("owner_id", data.user.id)
        .single()
        .then(({ data: store }) => {
          if (store) router.push("/dashboard");
        });
    });
  }, [router]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "name") {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleFinish = async () => {
    if (!form.name.trim()) {
      toast.error("Ingresa el nombre de tu tienda");
      return;
    }
    if (!userId) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // Prevent duplicate stores
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", userId)
        .single();
        
      if (existingStore) {
        toast.error("Ya tienes una tienda creada.");
        router.push("/dashboard");
        return;
      }

      // Create the store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .insert({
          name: form.name.trim(),
          slug: form.slug || slugify(form.name),
          description: form.description,
          owner_id: userId,
          plan: "free",
          is_active: true,
        })
        .select("id")
        .single();

      if (storeError) {
        console.error("Store insert error:", storeError);
        if (storeError.code === "23505" || storeError.message?.includes("duplicate")) {
          toast.error("Ya existe una tienda con ese slug. Cambia el nombre.");
        } else if (storeError.code === "42501" || storeError.message?.includes("permission") || storeError.message?.includes("policy")) {
          toast.error(`Error de permisos RLS: ${storeError.message}. ¿Aplicaste el schema SQL en Supabase?`);
        } else if (storeError.code === "42P01" || storeError.message?.includes("does not exist")) {
          toast.error("La tabla 'stores' no existe. Necesitás aplicar el schema SQL en Supabase primero.");
        } else {
          toast.error(`Error [${storeError.code}]: ${storeError.message}`);
        }
        setSaving(false);
        return;
      }

      // Create store settings
      const { error: settingsError } = await supabase.from("store_settings").insert({
        store_id: store.id,
        currency: form.currency,
        whatsapp_number: form.whatsapp.replace(/\D/g, ""),
        template: "modern",
        primary_color: "#2563eb",
        secondary_color: "#7c3aed",
      });
      if (settingsError) {
        console.error("Settings insert error:", settingsError);
        // Non-fatal: continue even if settings fail
      }

      // Create default section visibility
      const sections = [
        "hero_banner",
        "featured_categories",
        "featured_products",
        "main_catalog",
        "promo_banner",
        "recommended_products",
      ];
      const { error: sectionsError } = await supabase.from("store_sections_visibility").insert(
        sections.map((section, i) => ({
          store_id: store.id,
          section,
          is_visible: true,
          sort_order: i + 1,
        }))
      );
      if (sectionsError) {
        console.error("Sections insert error:", sectionsError);
        // Non-fatal: continue
      }

      setStep(2); // success step
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      console.error("Onboarding error:", err);
      toast.error(`Error: ${e?.message || "Intenta de nuevo."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-6">
      {/* Background dots */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-display font-bold text-2xl">
            Impels<span className="text-blue-400">Commerce</span>
          </span>
        </div>

        {/* Step indicators */}
        {step < 2 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.slice(0, 2).map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                    i === step
                      ? "text-white"
                      : i < step
                        ? "text-green-400"
                        : "text-white/30"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step
                        ? "bg-green-500 text-white"
                        : i === step
                          ? "gradient-brand text-white shadow-glow"
                          : "bg-white/10 text-white/40"
                    }`}
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 1 && (
                  <div
                    className={`w-12 h-px transition-all ${
                      i < step ? "bg-green-400" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="glass-dark rounded-3xl border border-white/10 p-8 shadow-2xl">
          {/* ── STEP 0: Store info ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <Store className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="font-display text-3xl font-black text-white mb-1">
                  ¡Creemos tu tienda!
                </h1>
                <p className="text-white/60 text-sm">
                  Solo necesitamos algunos datos básicos para comenzar.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Nombre de tu tienda *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ej: Boutique Valentina"
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    URL de tu tienda
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/15 focus-within:border-blue-400 transition-all">
                    <span className="bg-white/5 text-white/40 text-sm px-3 flex items-center border-r border-white/10 whitespace-nowrap flex-shrink-0">
                      impels-platform.vercel.app/store/
                    </span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      placeholder="mi-tienda"
                      className="flex-1 bg-transparent text-white placeholder-white/30 px-3 py-3 text-sm focus:outline-none min-w-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Describe brevemente tu tienda..."
                    rows={2}
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Moneda
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full bg-white/10 border border-white/15 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all"
                  >
                    <option value="Gs" className="bg-gray-900">Guaraníes (Gs) — Paraguay</option>
                    <option value="ARS" className="bg-gray-900">Peso Argentino (ARS)</option>
                    <option value="COP" className="bg-gray-900">Peso Colombiano (COP)</option>
                    <option value="MXN" className="bg-gray-900">Peso Mexicano (MXN)</option>
                    <option value="BRL" className="bg-gray-900">Real Brasileño (BRL)</option>
                    <option value="USD" className="bg-gray-900">Dólar (USD)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!form.name.trim()) {
                    toast.error("Ingresa el nombre de tu tienda");
                    return;
                  }
                  setStep(1);
                }}
                className="w-full gradient-brand text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-glow transition-all hover:scale-[1.02]"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── STEP 1: WhatsApp ───────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <h1 className="font-display text-3xl font-black text-white mb-1">
                  Tu WhatsApp
                </h1>
                <p className="text-white/60 text-sm">
                  Tus clientes usarán este número para enviarte pedidos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    Número de WhatsApp
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">
                      +
                    </span>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => handleChange("whatsapp", e.target.value)}
                      placeholder="595991234567"
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:bg-white/15 transition-all"
                      autoFocus
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    Código de país sin el + • Ej: 595 (Paraguay), 54 (Argentina), 52 (México)
                  </p>
                </div>

                {/* WhatsApp preview */}
                {form.whatsapp && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <p className="text-green-400 text-xs font-semibold mb-2">
                      Vista previa del botón en tu tienda:
                    </p>
                    <div className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl w-fit">
                      <Phone className="w-4 h-4" />
                      Pedir por WhatsApp
                    </div>
                  </div>
                )}

                <p className="text-white/40 text-xs">
                  Podés configurar esto más tarde en Configuración si no lo tenés a mano.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Crear mi tienda
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Success ────────────────────────────────── */}
          {step === 2 && (
            <div className="text-center space-y-6 animate-fade-in py-4">
              {/* Animated checkmark */}
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto">
                <Check className="w-9 h-9 text-green-400" />
              </div>

              <div>
                <h1 className="font-display text-3xl font-black text-white mb-2">
                  ¡Tu tienda está lista! 🎉
                </h1>
                <p className="text-white/60">
                  <span className="text-blue-400 font-semibold">{form.name}</span>{" "}
                  fue creada exitosamente. Ahora podés agregar tus productos.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                  Tu tienda pública
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm text-blue-300 font-mono truncate">
                    impels-platform.vercel.app/store/{form.slug}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full gradient-brand text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-glow transition-all hover:scale-[1.02]"
                >
                  Ir al Dashboard
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push("/dashboard/products/new")}
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-all"
                >
                  + Agregar mi primer producto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Already have an account */}
        {step === 0 && (
          <p className="text-center text-white/30 text-sm mt-6">
            ¿Querés cerrar sesión?{" "}
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="text-white/60 hover:text-white transition-colors underline"
            >
              Salir
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
