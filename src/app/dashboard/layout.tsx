import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BottomNav from "@/components/dashboard/BottomNav";
import OrderNotificationListener from "@/components/dashboard/OrderNotificationListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's store
  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", user.id)
    .single();

  // Also check if user is a member of a store (not owner)
  let memberStore = null;
  if (!store) {
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

  // Normalize user for header
  const authUser = {
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <OrderNotificationListener storeId={activeStore.id} />
      <DashboardSidebar store={activeStore as import('@/lib/types').Store} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <DashboardHeader user={authUser} store={activeStore as import('@/lib/types').Store} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
