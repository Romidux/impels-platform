import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getStoreStudioData() {
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

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;

  const branding = Array.isArray(store.store_branding)
    ? store.store_branding[0]
    : store.store_branding;

  return {
    store,
    settings,
    branding,
    sections: sections || [],
  };
}
