import HomepageManager from "@/components/dashboard/store/HomepageManager";
import { StoreStudioSubpageShell } from "@/components/dashboard/store/StoreStudioSubpageShell";
import { getStoreStudioData } from "../_lib/getStoreStudioData";

export default async function StoreHomePage() {
  const { store, settings, branding } = await getStoreStudioData();

  return (
    <StoreStudioSubpageShell title="Inicio" slug={store.slug}>
      <HomepageManager store={store} settings={settings} branding={branding} />
    </StoreStudioSubpageShell>
  );
}
