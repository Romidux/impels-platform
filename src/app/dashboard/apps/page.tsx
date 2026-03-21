import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { revalidatePath } from "next/cache";
import { Code, LineChart, Send } from "lucide-react";

export default async function AppsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_settings(*)")
    .eq("owner_id", user.id)
    .single();

  if (!store) {
    redirect("/onboarding");
  }

  const settings = store.store_settings?.[0] || {};
  const metaPixel = settings.meta_pixel_id || "";
  const googleAnalytics = settings.google_analytics_id || "";

  // Server Actions for saving tokens
  async function saveMetaPixel(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const pixelId = formData.get("pixelId")?.toString().trim() || null;
    
    await supabaseServer
      .from("store_settings")
      .update({ meta_pixel_id: pixelId })
      .eq("store_id", store!.id);
      
    revalidatePath("/dashboard/apps");
  }

  async function saveGoogleAnalytics(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const gaId = formData.get("gaId")?.toString().trim() || null;
    
    await supabaseServer
      .from("store_settings")
      .update({ google_analytics_id: gaId })
      .eq("store_id", store!.id);
      
    revalidatePath("/dashboard/apps");
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Aplicaciones y Píxeles"
        subtitle="Conecta herramientas externas para medir tus visitas y potenciar tus ventas."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Meta Pixel App Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Píxel de Meta</h3>
              <p className="text-sm text-slate-500 mt-1 mb-3">
                Rastrea eventos de Facebook e Instagram (PageViews, AddToCart, Purchase) automáticamente en toda tu tienda.
              </p>
              {metaPixel ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                  Desconectado
                </span>
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50 flex-1">
            <form action={saveMetaPixel} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ID del Píxel
                </label>
                <input
                  type="text"
                  name="pixelId"
                  defaultValue={metaPixel}
                  placeholder="Ej. 123456789012345"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full justify-center">
                Guardar Píxel de Meta
              </Button>
            </form>
          </div>
        </div>

        {/* Google Analytics App Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Google Analytics 4</h3>
              <p className="text-sm text-slate-500 mt-1 mb-3">
                Mide de dónde vienen tus visitantes y cuál es tu tasa de conversión con informes detallados de Google.
              </p>
              {googleAnalytics ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                  Desconectado
                </span>
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50 flex-1">
            <form action={saveGoogleAnalytics} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ID de Medición (G-XXX...)
                </label>
                <input
                  type="text"
                  name="gaId"
                  defaultValue={googleAnalytics}
                  placeholder="Ej. G-12345ABCD"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono uppercase"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full justify-center">
                Guardar Google Analytics
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
