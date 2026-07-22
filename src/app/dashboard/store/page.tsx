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
  AlertCircle,
  ArrowRight,
  Copy,
  Globe,
} from "lucide-react";
import { getStoreUrl } from "@/lib/utils";
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

  const { store, settings, branding, sections } = await getStoreStudioData();
  const storeUrl = getStoreUrl(store.slug);

  const heroReady = Boolean(settings?.hero_title || settings?.hero_subtitle);
  const hasHeroImage = Boolean(branding?.hero_banner_url);
  const hasWhatsApp = Boolean(settings?.whatsapp_number);
  const hasPayments = (settings?.payment_methods?.length ?? 0) > 0;
  const templateLabel = TEMPLATE_LABELS[settings?.template || "minimal"] || "Minimal";
  const primaryColor = settings?.primary_color || "#2563eb";
  const visibleSections =
    sections.length > 0
      ? sections.filter((s) => s.is_visible).length
      : 6;

  // Per-section completion
  const sectionStatus = [
    {
      label: "Identidad",
      description: "Nombre, descripción y enlace público",
      href: "/dashboard/store/identity",
      icon: StoreIcon,
      color: "text-brand-600",
      bg: "bg-brand-50",
      done: Boolean(store.name && store.slug),
      detail: store.name || "Sin nombre",
    },
    {
      label: "Apariencia",
      description: "Plantilla base y color principal",
      href: "/dashboard/store/appearance",
      icon: Palette,
      color: "text-violet-600",
      bg: "bg-violet-50",
      done: Boolean(settings?.template && settings?.primary_color),
      detail: settings?.template ? templateLabel : "Sin configurar",
    },
    {
      label: "Portada",
      description: "Hero, banner y mensaje principal",
      href: "/dashboard/store/home",
      icon: Home,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      done: heroReady && hasHeroImage,
      detail: heroReady ? (settings?.hero_title || "Título listo") : "Falta el mensaje principal",
    },
    {
      label: "Secciones",
      description: "Orden y visibilidad de bloques",
      href: "/dashboard/store/sections",
      icon: Layers,
      color: "text-amber-600",
      bg: "bg-amber-50",
      done: visibleSections > 0,
      detail: `${visibleSections} secciones visibles`,
    },
    {
      label: "Ventas y contacto",
      description: "WhatsApp, pagos, envíos y redes",
      href: "/dashboard/store/sales",
      icon: Phone,
      color: "text-rose-600",
      bg: "bg-rose-50",
      done: hasWhatsApp && hasPayments,
      detail: hasWhatsApp ? "WhatsApp configurado" : "Falta WhatsApp",
    },
  ] as const;

  const completedCount = sectionStatus.filter((s) => s.done).length;
  const totalCount = sectionStatus.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-6 animate-fade-in">
      {/* Store identity banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            Mi Tienda
          </h1>
          <p className="mt-2 text-base text-[#6E6E73] font-normal">
            Gestiona la identidad, el diseño y el contenido de tu tienda.
          </p>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700 flex-shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
          Ver tienda
        </a>
      </div>

      {/* Store URL + progress */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100">
              <Globe className="h-5 w-5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Enlace público
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                {storeUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Progress ring */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="4"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke={allDone ? "#10b981" : "#3b82f6"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPct / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-700">
                  {progressPct}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {allDone ? "Tienda completa" : `${completedCount} de ${totalCount}`}
                </p>
                <p className="text-xs text-slate-400">
                  {allDone ? "Todo configurado ✓" : "secciones listas"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StoreStudioMobilePreview slug={store.slug} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,360px]">
        {/* Section links */}
        <div className="space-y-3">
          {sectionStatus.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${item.bg} ${item.color} transition-transform group-hover:scale-105`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 truncate">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-600" />
                </div>
              </Link>
            );
          })}
        </div>

        <StoreStudioDesktopPreview slug={store.slug} />
      </div>
    </div>
  );
}
