import { StoreStudioDesktopPreview, StoreStudioMobilePreview } from "./StoreStudioPreview";

export function StoreStudioSubpageShell({
  title,
  slug,
  children,
}: {
  title: string;
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[1fr,360px]">
      <div className="min-w-0">
        <div className="mb-6">
          <p className="text-sm text-gray-500">Mi Tienda</p>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>

        <StoreStudioMobilePreview slug={slug} />

        <div className="mt-6 xl:mt-0">{children}</div>
      </div>

      <StoreStudioDesktopPreview slug={slug} />
    </div>
  );
}
