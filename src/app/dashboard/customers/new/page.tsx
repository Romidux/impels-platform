import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerForm from "@/components/dashboard/CustomerForm";

export default async function NewCustomerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!store) redirect("/onboarding");

  return <CustomerForm storeId={store.id} />;
}
