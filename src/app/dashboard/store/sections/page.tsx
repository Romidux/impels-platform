import SectionsManager from "@/components/dashboard/store/SectionsManager";
import { StoreStudioSubpageShell } from "@/components/dashboard/store/StoreStudioSubpageShell";
import { getStoreStudioData } from "../_lib/getStoreStudioData";

export default async function StoreSectionsPage() {
  const { store, sections } = await getStoreStudioData();

  return (
    <StoreStudioSubpageShell title="Secciones" slug={store.slug}>
      <SectionsManager store={store} sections={sections} />
    </StoreStudioSubpageShell>
  );
}
