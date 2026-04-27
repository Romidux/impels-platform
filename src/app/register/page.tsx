"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Eye, EyeOff, Store, ArrowRight, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/events";
import { createStoreForUser } from "./actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    storeName: "",
    storeSlug: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "storeName") {
        updated.storeSlug = slugify(value);
      }
      return updated;
    });
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error("Error al conectar con Google. Intenta de nuevo.");
        setGoogleLoading(false);
      }
      // On success, browser is redirected by Supabase — no need to setLoading(false)
    } catch {
      toast.error("Error inesperado. Intenta de nuevo.");
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // 1) Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            store_name: form.storeName,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Error al crear la cuenta");
        return;
      }

      // 2) Create store atomically via RPC (bypasses RLS — user has no session yet)
      // This creates stores + store_settings + sections + branding + owner member
      // in a single Postgres transaction — all or nothing.
      const { error: storeError } = await createStoreForUser({
        userId: authData.user.id,
        name: form.storeName,
        slug: form.storeSlug,
      });

      if (storeError) {
        if (storeError === "slug_taken") {
          toast.error("Cuenta creada, pero ese nombre de tienda ya está en uso. Elige otro.");
          router.push("/onboarding");
          return;
        }
        if (storeError === "already_has_store") {
          toast.success("Ya tienes una tienda. Redirigiendo...");
          router.push("/dashboard");
          return;
        }
        // Show the actual error for debugging — critical for diagnosing issues
        console.error("[Register] Store creation failed:", storeError);
        toast.error(`Cuenta creada, pero hubo un error con la tienda: ${storeError}`);
        router.push("/onboarding");
        return;
      }

      toast.success("¡Cuenta y tienda creadas! Redirigiendo...");
      // Fire-and-forget server action
      sendWelcomeEmail(form.email, form.storeName).catch(console.error);

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      toast.error("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Impels<span className="gradient-text">Commerce</span>
            </span>
          </Link>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? "gradient-brand text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-px transition-all ${step > s ? "bg-blue-500" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-dark border border-white/10 rounded-3xl p-8 shadow-2xl">
          {step === 1 ? (
            <>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Crea tu cuenta
              </h1>
              <p className="text-gray-400 mb-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Iniciar sesión
                </Link>
              </p>

              {/* Google button */}
              <button
                onClick={handleGoogleRegister}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-60 mb-6"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-sm">o con email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl pl-10 pr-12 py-3 outline-none focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!form.email || !form.password) {
                      toast.error("Completa todos los campos");
                      return;
                    }
                    if (form.password.length < 8) {
                      toast.error("La contraseña debe tener al menos 8 caracteres");
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full flex items-center justify-center gap-2 gradient-brand text-white font-bold py-3.5 rounded-xl hover:shadow-glow transition-all hover:scale-[1.02]"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegister}>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Nombra tu tienda
              </h1>
              <p className="text-gray-400 mb-8">
                Este será tu espacio en Impels Commerce.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de la tienda
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={(e) => handleChange("storeName", e.target.value)}
                      placeholder="Ej: Mi Tienda Geek"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL de tu tienda
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-blue-500 transition-all">
                    <span className="bg-white/5 text-gray-400 text-sm px-3 flex items-center border-r border-white/10 whitespace-nowrap">
                      impels-platform.vercel.app/store/
                    </span>
                    <input
                      type="text"
                      value={form.storeSlug}
                      onChange={(e) => handleChange("storeSlug", e.target.value)}
                      placeholder="mi-tienda"
                      required
                      className="flex-1 bg-white/5 text-white placeholder:text-gray-500 px-3 py-3 outline-none text-sm"
                    />
                  </div>
                  {form.storeSlug && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Tu tienda estará en:{" "}
                      <span className="text-blue-400">impels-platform.vercel.app/store/{form.storeSlug}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-white/10 text-gray-300 font-semibold py-3.5 rounded-xl hover:bg-white/5 transition-all"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 gradient-brand text-white font-bold py-3.5 rounded-xl hover:shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        ¡Crear tienda!
                        <Zap className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Al crear tu cuenta aceptas nuestros{" "}
          <Link href="#" className="text-gray-400 hover:text-gray-200">
            Términos de uso
          </Link>{" "}
          y{" "}
          <Link href="#" className="text-gray-400 hover:text-gray-200">
            Política de privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
