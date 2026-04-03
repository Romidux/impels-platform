import ThemeManager from "@/components/dashboard/store/ThemeManager";
import { StoreStudioSubpageShell } from "@/components/dashboard/store/StoreStudioSubpageShell";
import { getStoreStudioData } from "../_lib/getStoreStudioData";

export default async function StoreAppearancePage() {
  const { store, settings } = await getStoreStudioData();

  return (
    <StoreStudioSubpageShell title="Apariencia" slug={store.slug}>
      <ThemeManager store={store} settings={settings} />
    </StoreStudioSubpageShell>
  );
}
