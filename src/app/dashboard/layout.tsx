import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getStore } from "@/lib/supabase/queries";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
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

  return (
    <div className="min-h-screen bg-[#e8ecf4] flex">
      <OrderNotificationListener storeId={activeStore.id} />
      <DashboardSidebar
        store={activeStore as import('@/lib/types').Store}
        user={authUser}
      />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto md:ml-64">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav storeSlug={activeStore.slug} />
    </div>
  );
}
