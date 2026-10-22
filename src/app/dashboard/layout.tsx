import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BottomNav from "@/components/dashboard/BottomNav";
import OrderNotificationListener from "@/components/dashboard/OrderNotificationListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's store (cached — shared with page components in same request)
  let store = await getStore(user.id);

  // Also check if user is a member of a store (not owner)
  let memberStore = null;
  if (!store) {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("store_members")
      .select("*, stores(*, store_settings(*))")
      .eq("user_id", user.id)
      .single();
    if (membership) {
      memberStore = (membership as { stores: unknown }).stores;
    }
  }

  const activeStore = store || memberStore;

  if (!activeStore) {
    redirect("/onboarding");
  }

  const authUser = {
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
  };

  const typedStore = activeStore as import('@/lib/types').Store;

  /* Shell de tres paneles: el fondo de la app es BLANCO y el sidebar, la barra
     superior y el contenido son paneles grises redondeados apoyados encima. Al
     revés de como estaba (fondo gris + tarjetas blancas).

     En desktop la altura la fija el shell (h-screen) y scrollea solo el panel de
     contenido, como una app de escritorio. En mobile se vuelve a scroll de
     página normal: con h-screen, la barra del navegador móvil se come el alto y
     el contenido queda cortado. */
  return (
    <div className="flex min-h-screen w-full bg-white md:h-screen md:overflow-hidden">
      <OrderNotificationListener storeId={activeStore.id} />
      <DashboardSidebar store={typedStore} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 pb-20 md:pb-3">
        <DashboardHeader user={authUser} store={typedStore} />

        <main className="flex min-h-0 flex-1 flex-col rounded-2xl bg-neutral-50 p-4 md:overflow-y-auto md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <BottomNav storeSlug={activeStore.slug} />
    </div>
  );
}
