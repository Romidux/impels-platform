import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamManager from "@/components/dashboard/TeamManager";
import { Store, StoreMember } from "@/lib/types";

export default async function TeamPage() {
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

  const { data: members } = await supabase
    .from("store_members")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at");

  return (
    <TeamManager
      store={store as Store}
      currentUserId={user.id}
      members={(members || []) as StoreMember[]}
    />
  );
}
