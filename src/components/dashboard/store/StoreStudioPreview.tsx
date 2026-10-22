import { Eye, ChevronDown } from "lucide-react";

export function StoreStudioMobilePreview({ slug }: { slug: string }) {
  return (
    <div className="xl:hidden">
      <details className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.16em] text-neutral-400">
              Vista previa
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              Revisa como se ve tu tienda
            </p>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <Eye className="h-4 w-4" />
            <ChevronDown className="h-4 w-4" />
          </div>
        </summary>

        <div className="border-t border-neutral-100 p-3">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-center border-b border-neutral-200 bg-white px-4 py-3">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-2xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Preview mobile
              </span>
            </div>
            <div className="h-[420px] bg-white">
              <iframe
                src={`/store/${slug}`}
                className="h-full w-full border-none"
                title="Storefront Preview Mobile"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

export function StoreStudioDesktopPreview({ slug }: { slug: string }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <p className="text-2xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            Vista previa
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            Asi se vera tu tienda
          </p>
        </div>

        <div className="px-4 pb-4">
          <div className="mt-4 overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-center border-b border-neutral-200 bg-white px-4 py-3">
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-2xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                Preview desktop
              </span>
            </div>
            <div className="h-[640px] bg-white">
              <iframe
                src={`/store/${slug}`}
                className="h-full w-full border-none"
                title="Storefront Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
