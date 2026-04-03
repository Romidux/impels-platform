import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";
import { StoreStudioSubpageShell } from "@/components/dashboard/store/StoreStudioSubpageShell";
import { getStoreStudioData } from "../_lib/getStoreStudioData";

export default async function StoreIdentityPage() {
  const { store, settings } = await getStoreStudioData();

  return (
    <StoreStudioSubpageShell title="Identidad" slug={store.slug}>
      <StoreSettingsForm store={store} settings={settings} mode="identity" />
    </StoreStudioSubpageShell>
  );
}
