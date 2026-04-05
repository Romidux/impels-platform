"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Creates a complete store with all related records atomically.
 *
 * Uses the create_store_complete() RPC which runs as a single Postgres
 * transaction — the store, settings, sections, branding, and owner
 * membership are ALL created or NONE are created.
 *
 * This function uses the admin client (service_role) because:
 *   - During registration, the user just signed up and has no session yet
 *   - The RPC is restricted to service_role only (REVOKE from anon/authenticated)
 */
export async function createStoreForUser(params: {
  userId: string;
  name: string;
  slug: string;
  description?: string;
  currency?: string;
  whatsapp?: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_store_complete", {
    p_owner_id: params.userId,
    p_name: params.name,
    p_slug: params.slug,
    p_description: params.description || null,
    p_currency: params.currency || "Gs",
    p_whatsapp: params.whatsapp || null,
  });

  if (error) {
    // User already has a store — redirect to dashboard
    if (error.message?.includes("USER_ALREADY_HAS_STORE")) {
      return { error: "already_has_store", storeId: null };
    }
    // Slug uniqueness violation (stores_slug_key)
    if (error.code === "23505" || error.message?.includes("stores_slug_key")) {
      return { error: "slug_taken", storeId: null };
    }
    // Any other error
    return { error: error.message, storeId: null };
  }

  return { error: null, storeId: data as string };
}
