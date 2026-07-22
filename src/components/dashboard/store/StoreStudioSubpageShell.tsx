import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoreStudioDesktopPreview, StoreStudioMobilePreview } from "./StoreStudioPreview";

export function StoreStudioSubpageShell({
  title,
  subtitle,
  slug,
  children,
}: {
  title: string;
  subtitle?: string;
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mt-2 sm:mt-4 mb-2">
        <Link
          href="/dashboard/store"
          className="p-2 -ml-2 rounded-xl hover:bg-[#F0F0F2] text-[#86868B] hover:text-[#1D1D1F] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-semibold text-[#1D1D1F] tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-base text-[#6E6E73] font-normal">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[1fr,360px]">
        <div className="min-w-0 space-y-6">
          {children}
          <StoreStudioMobilePreview slug={slug} />
        </div>

        <StoreStudioDesktopPreview slug={slug} />
      </div>
    </div>
  );
}
