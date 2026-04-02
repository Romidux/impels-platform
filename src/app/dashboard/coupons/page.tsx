import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CouponsManager from "@/components/dashboard/CouponsManager";
import { Coupon } from "@/lib/types";

export default async function CouponsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  // Fetch all coupons for the store
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <CouponsManager
      storeId={store.id}
      initialCoupons={(coupons || []) as Coupon[]}
    />
  );
}
