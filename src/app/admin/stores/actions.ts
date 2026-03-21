"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleStoreActive(storeId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("stores")
    .update({ is_active: isActive })
    .eq("id", storeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeId}`);
  revalidatePath("/admin");

  return { success: true };
}
