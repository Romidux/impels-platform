"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createStoreForUser(params: {
  userId: string;
  name: string;
  slug: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("stores").insert({
    name: params.name,
    slug: params.slug,
    owner_id: params.userId,
    plan: "free",
    is_active: true,
  });

  if (error) {
    return { error: error.code === "23505" ? "slug_taken" : error.message };
  }

  return { error: null };
}
