import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppearanceManager from "@/components/dashboard/AppearanceManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppearancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*), store_branding(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { data: sections } = await supabase
    .from("store_sections_visibility")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  return (
    <AppearanceManager
      store={store}
      settings={store.store_settings?.[0]}
      branding={store.store_branding?.[0]}
      sections={sections || []}
    />
  );
}
