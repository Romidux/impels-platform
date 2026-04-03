import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Store as StoreIcon,
  Palette,
  Home,
  Layers,
  Phone,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getStoreUrl } from "@/lib/utils";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";
import { StoreStudioDesktopPreview, StoreStudioMobilePreview } from "@/components/dashboard/store/StoreStudioPreview";
import { getStoreStudioData } from "./_lib/getStoreStudioData";

const TEMPLATE_LABELS: Record<string, string> = {
  minimal: "Minimal",
  modern: "Modern",
  brand: "Brand",
};

const tabRedirects: Record<string, string> = {
  identity: "/dashboard/store/identity",
  appearance: "/dashboard/store/appearance",
  homepage: "/dashboard/store/home",
  sections: "/dashboard/store/sections",
  commerce: "/dashboard/store/sales",
  footer: "/dashboard/store/sales",
};

const studioLinks = [
  {
    label: "Identidad",
    description: "Nombre, descripcion y enlace publico",
    href: "/dashboard/store/identity",
    icon: StoreIcon,
  },
  {
    label: "Apariencia",
    description: "Template base y color principal",
    href: "/dashboard/store/appearance",
    icon: Palette,
  },
  {
    label: "Inicio",
    description: "Hero, banner y mensaje principal",
    href: "/dashboard/store/home",
    icon: Home,
  },
  {
    label: "Secciones",
    description: "Orden y visibilidad de bloques",
    href: "/dashboard/store/sections",
    icon: Layers,
  },
  {
    label: "Ventas y contacto",
    description: "WhatsApp, pagos, envios y redes",
    href: "/dashboard/store/sales",
    icon: Phone,
  },
] as const;

export default async function StoreHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedTab = resolvedSearchParams?.tab;

  if (requestedTab && tabRedirects[requestedTab]) {
    redirect(tabRedirects[requestedTab]);
  }

  const { store, settings, sections } = await getStoreStudioData();
  const storeUrl = getStoreUrl(store.slug);
  const visibleSections =
    sections.length > 0
      ? sections.filter((section) => section.is_visible).length
      : 6;
  const heroReady = Boolean(settings?.hero_title || settings?.hero_subtitle);
  const templateLabel =
    TEMPLATE_LABELS[settings?.template || "modern"] || "Modern";
  const primaryColor = settings?.primary_color || "#2563eb";
  const hasWhatsApp = Boolean(settings?.whatsapp_number);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-6 animate-fade-in">
      <DashPageHeader
        title="Mi Tienda"
        subtitle="Centraliza la identidad, el diseno y el contenido de tu tienda en un solo lugar."
      >
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          Ver tienda
        </a>
      </DashPageHeader>

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
            Estado portada
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CheckCircle2
              className={`h-4 w-4 ${
                heroReady ? "text-emerald-500" : "text-slate-300"
              }`}
            />
            {heroReady ? "Mensaje principal listo" : "Falta completar portada"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Hero y mensaje inicial</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Venta activa
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {hasWhatsApp ? "WhatsApp configurado" : "WhatsApp pendiente"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {visibleSections} secciones visibles
          </p>
        </div>
      </section>

      <StoreStudioMobilePreview slug={store.slug} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,360px]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Centro de personalizacion
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
                  Edita tu tienda por bloques claros
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Entra a cada area para trabajar una parte especifica de la tienda sin repetir contenido ni perder contexto.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {studioLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition-colors group-hover:text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <StoreStudioDesktopPreview slug={store.slug} />
      </div>
    </div>
  );
}
