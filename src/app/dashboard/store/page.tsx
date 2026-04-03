import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn, getStoreUrl } from "@/lib/utils";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Store as StoreIcon,
  Palette,
  Home,
  Layers,
  Phone,
  Link as LinkIcon,
  ExternalLink,
  Eye,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import ThemeManager from "@/components/dashboard/store/ThemeManager";
import HomepageManager from "@/components/dashboard/store/HomepageManager";
import SectionsManager from "@/components/dashboard/store/SectionsManager";
import FooterSocialManager from "@/components/dashboard/store/FooterSocialManager";
import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";

const STUDIO_SECTIONS = [
  {
    value: "identity",
    label: "Identidad",
    description: "Nombre, descripcion y URL publica",
    icon: StoreIcon,
  },
  {
    value: "appearance",
    label: "Apariencia",
    description: "Template base y color principal",
    icon: Palette,
  },
  {
    value: "homepage",
    label: "Inicio",
    description: "Hero, banner y mensaje principal",
    icon: Home,
  },
  {
    value: "sections",
    label: "Secciones",
    description: "Orden y visibilidad de bloques",
    icon: Layers,
  },
  {
    value: "commerce",
    label: "Ventas y contacto",
    description: "WhatsApp, pagos, envios y moneda",
    icon: Phone,
  },
  {
    value: "footer",
    label: "Footer y redes",
    description: "Redes sociales y textos finales",
    icon: LinkIcon,
  },
] as const;

const TEMPLATE_LABELS: Record<string, string> = {
  minimal: "Minimal",
  modern: "Modern",
  brand: "Brand",
};

function StudioSectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default async function UnifiedStoreSettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const currentTab = searchParams.tab || "identity";
  const isSpecificTab = Boolean(searchParams.tab);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const storeUrl = getStoreUrl(store.slug);
  const visibleSections =
    sections && sections.length > 0
      ? sections.filter((section) => section.is_visible).length
      : 6;
  const heroReady = Boolean(settings?.hero_title || settings?.hero_subtitle);
  const templateLabel = TEMPLATE_LABELS[settings?.template || "modern"] || "Modern";
  const primaryColor = settings?.primary_color || "#2563eb";
  const hasWhatsApp = Boolean(settings?.whatsapp_number);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-6 animate-fade-in">
      {!isSpecificTab && (
        <DashPageHeader
          title="Mi Tienda"
          subtitle="Centraliza la identidad, el diseño y el contenido de tu tienda en un solo lugar."
        >
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-brand-200 hover:text-brand-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ver tienda
          </a>
        </DashPageHeader>
      )}

      {isSpecificTab && (
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/store"
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-200">
              <ChevronDown className="h-4 w-4 rotate-90" />
            </div>
            Volver a Mi Tienda
          </Link>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            Vista previa pública
          </a>
        </div>
      )}

      {!isSpecificTab && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Template actual
            </p>
            <p className="mt-2 font-display text-2xl font-black text-slate-950">
              {templateLabel}
            </p>
            <p className="mt-1 text-sm text-slate-500">Base visual de la tienda</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Color principal
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-2xl border border-slate-200 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-sm font-semibold text-slate-900">
                {primaryColor}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Botones y acentos</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Portada
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2
                className={`h-4 w-4 ${
                  heroReady ? "text-emerald-500" : "text-slate-300"
                }`}
              />
              {heroReady ? "Mensaje inicial listo" : "Falta completar portada"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hero y banner promocional
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Venta activa
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {hasWhatsApp ? "WhatsApp configurado" : "WhatsApp pendiente"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {visibleSections} secciones visibles en la tienda
            </p>
          </div>
        </section>
      )}


      <div className="xl:hidden">
        <details className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Vista previa
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Revisa cómo se ve tu tienda
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Eye className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </div>
          </summary>
          <div className="border-t border-slate-100 p-3">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-center border-b border-slate-200 bg-white px-4 py-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Preview mobile
                </span>
              </div>
              <div className="h-[420px] bg-white">
                <iframe
                  src={`/store/${store.slug}`}
                  className="h-full w-full border-none"
                  title="Storefront Preview Mobile"
                />
              </div>
            </div>
          </div>
        </details>
      </div>

      <Tabs
        key={currentTab}
        defaultValue={currentTab}
        orientation="vertical"
        className={cn(
          "grid min-h-0 grid-cols-1 gap-6",
          isSpecificTab
            ? "xl:grid-cols-[1fr,360px]"
            : "xl:grid-cols-[260px,1fr,360px]"
        )}
      >
        {!isSpecificTab && (
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="px-3 pb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Centro de personalizacion
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Edita tu tienda por capas, de forma clara y sin perder
                  contexto.
                </p>
              </div>

              <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
                {STUDIO_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <TabsTrigger
                      key={section.value}
                      value={section.value}
                      className="group w-full justify-start rounded-2xl px-3 py-3 text-left data-[state=active]:bg-slate-50 data-[state=active]:shadow-none"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-data-[state=active]:bg-brand-50 group-data-[state=active]:text-brand-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {section.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="mt-3 rounded-[22px] border border-brand-100 bg-brand-50/60 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Edicion por capas
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Primero defines la base visual, luego el mensaje de inicio
                      y por ultimo el orden de los bloques visibles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="min-w-0">
          <TabsContent value="identity" className="mt-0">
            <StudioSectionIntro
              eyebrow="Identidad"
              title="Define la base de tu tienda"
              description="Edita el nombre, la descripcion y el enlace publico que representan a tu marca."
            />
            <StoreSettingsForm store={store} settings={settings} mode="identity" />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <StudioSectionIntro
              eyebrow="Apariencia"
              title="Elige el estilo visual de tu tienda"
              description="Selecciona un template base y ajusta el color principal para que la tienda se vea alineada con tu marca."
            />
            <ThemeManager store={store} settings={settings} />
          </TabsContent>

          <TabsContent value="homepage" className="mt-0">
            <StudioSectionIntro
              eyebrow="Inicio"
              title="Controla el primer impacto"
              description="Personaliza el mensaje de bienvenida y el banner promocional que aparecen al entrar a tu tienda."
            />
            <HomepageManager store={store} settings={settings} branding={branding} />
          </TabsContent>

          <TabsContent value="sections" className="mt-0">
            <StudioSectionIntro
              eyebrow="Secciones"
              title="Ordena lo que se muestra primero"
              description="Decide que bloques aparecen en tu tienda y en que orden se presentan a tus clientes."
            />
            <SectionsManager store={store} sections={sections || []} />
          </TabsContent>

          <TabsContent value="commerce" className="mt-0">
            <StudioSectionIntro
              eyebrow="Ventas y contacto"
              title="Prepara la tienda para vender"
              description="Configura WhatsApp, email, moneda, metodos de pago y formas de entrega en una sola capa."
            />
            <StoreSettingsForm store={store} settings={settings} mode="commerce" />
          </TabsContent>

          <TabsContent value="footer" className="mt-0">
            <StudioSectionIntro
              eyebrow="Footer y redes"
              title="Cierra tu tienda con informacion util"
              description="Completa redes sociales y textos finales para que tu tienda se vea mas profesional y conectada."
            />
            <FooterSocialManager
              store={store}
              settings={settings}
              branding={branding}
            />
          </TabsContent>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Vista previa
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Asi se vera tu tienda
              </p>
            </div>

            <div className="px-4 pb-4">
              <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-center border-b border-slate-200 bg-white px-4 py-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Preview desktop
                  </span>
                </div>
                <div className="h-[640px] bg-white">
                  <iframe
                    src={`/store/${store.slug}`}
                    className="h-full w-full border-none"
                    title="Storefront Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </Tabs>
    </div>
  );
}
