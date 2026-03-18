import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SectionsManager from "@/components/dashboard/store/SectionsManager";
import { DashPageHeader } from "@/components/dashboard/ui/DashPageHeader";

export default async function SectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  const { data: sections } = await supabase
    .from("store_sections_visibility")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  return (
    <div className="space-y-5 animate-fade-in">
      <DashPageHeader
        title="Secciones"
        subtitle="Activa, desactiva y reordena las secciones de tu tienda"
      />
      <SectionsManager store={store} sections={sections || []} />
    </div>
  );
}
