import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const settings = store.store_settings?.[0];

  return <StoreSettingsForm store={store} settings={settings} />;
}
