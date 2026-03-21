import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Store, Paintbrush, LayoutTemplate, Layers, Link as LinkIcon, Settings } from "lucide-react";

import ThemeManager from "@/components/dashboard/store/ThemeManager";
import HomepageManager from "@/components/dashboard/store/HomepageManager";
import SectionsManager from "@/components/dashboard/store/SectionsManager";
import FooterSocialManager from "@/components/dashboard/store/FooterSocialManager";
import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";

export default async function UnifiedStoreSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all necessary data for the child managers
  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*), store_branding(*)")
    .eq("owner_id", user.id)
    .single();
    
  if (!store) redirect("/onboarding");

  const { data: sections } = await supabase
    .from("store_sections_visibility")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;
    
  const branding = Array.isArray(store.store_branding)
    ? store.store_branding[0]
    : store.store_branding;

  return (
    <div className="space-y-5 animate-fade-in relative max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-hidden flex flex-col pb-4">
      <DashPageHeader
        title="Mi Tienda"
        subtitle="Administra el diseño, la configuración y el contenido de tu portal de ventas"
      />

      {/* Main Hub Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Column: Form Controls inside Tabs */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <Tabs defaultValue="general" className="w-full h-full flex flex-col">
            <div className="px-2 pt-2 border-b border-slate-100 bg-slate-50">
              <TabsList className="w-full flex justify-start bg-transparent overflow-x-auto pb-0">
                <TabsTrigger value="general" className="gap-2">
                  <Settings className="w-4 h-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="theme" className="gap-2">
                  <Paintbrush className="w-4 h-4" />
                  Diseño
                </TabsTrigger>
                <TabsTrigger value="homepage" className="gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Inicio
                </TabsTrigger>
                <TabsTrigger value="sections" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Secciones
                </TabsTrigger>
                <TabsTrigger value="footer" className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Footer
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents - Scrollable areas */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
              <TabsContent value="general" className="mt-0 outline-none">
                <div className="max-w-2xl">
                  <StoreSettingsForm store={store} settings={settings} />
                </div>
              </TabsContent>
              
              <TabsContent value="theme" className="mt-0 outline-none">
                <div className="max-w-2xl">
                  <ThemeManager store={store} settings={settings} />
                </div>
              </TabsContent>
              
              <TabsContent value="homepage" className="mt-0 outline-none">
                <div className="max-w-2xl">
                  <HomepageManager store={store} settings={settings} branding={branding} />
                </div>
              </TabsContent>
              
              <TabsContent value="sections" className="mt-0 outline-none">
                <div className="max-w-2xl">
                  <SectionsManager store={store} sections={sections || []} />
                </div>
              </TabsContent>
              
              <TabsContent value="footer" className="mt-0 outline-none">
                <div className="max-w-2xl">
                  <FooterSocialManager store={store} settings={settings} branding={branding} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Column: Live Preview */}
        <div className="hidden lg:block lg:col-span-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
          <div className="absolute inset-x-0 top-0 h-10 bg-slate-200/50 flex items-center justify-center border-b border-slate-200 backdrop-blur-sm z-10">
            <span className="text-xs font-semibold text-slate-500 tracking-widest uppercase shadow-sm px-3 py-1 bg-white rounded-full">
              Vista previa
            </span>
          </div>
          <div className="pt-10 h-full w-full">
            <iframe 
              src={`/${store.slug}`}
              className="w-full h-full border-none bg-white opacity-95 transition-opacity duration-300 pointer-events-none"
              title="Storefront Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
