import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FooterSocialManager from "@/components/dashboard/store/FooterSocialManager";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";

export default async function FooterPage() {
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

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;
  const branding = Array.isArray(store.store_branding)
    ? store.store_branding[0]
    : store.store_branding;

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Footer y Redes sociales"
        subtitle="Configura los enlaces sociales y contenido del footer"
      />
      <FooterSocialManager
        store={store}
        settings={settings}
        branding={branding}
      />
    </div>
  );
}
