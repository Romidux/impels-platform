import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ThemeManager from "@/components/dashboard/store/ThemeManager";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";

export default async function ThemePage() {
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

  const settings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings;

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Tema"
        subtitle="Elige el template y colores de tu tienda"
      />
      <ThemeManager store={store} settings={settings} />
    </div>
  );
}
