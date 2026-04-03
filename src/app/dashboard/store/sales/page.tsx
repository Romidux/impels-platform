import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";
import FooterSocialManager from "@/components/dashboard/store/FooterSocialManager";
import { StoreStudioSubpageShell } from "@/components/dashboard/store/StoreStudioSubpageShell";
import { getStoreStudioData } from "../_lib/getStoreStudioData";

export default async function StoreSalesPage() {
  const { store, settings, branding } = await getStoreStudioData();

  return (
    <StoreStudioSubpageShell title="Ventas y contacto" slug={store.slug}>
      <div className="space-y-6">
        <StoreSettingsForm store={store} settings={settings} mode="commerce" />
        <FooterSocialManager store={store} settings={settings} branding={branding} />
      </div>
    </StoreStudioSubpageShell>
  );
}
