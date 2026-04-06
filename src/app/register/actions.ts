"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const CreateStoreSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  currency: z.string().max(10).optional(),
  whatsapp: z.string().max(30).optional(),
});

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
export async function createStoreForUser(params: z.infer<typeof CreateStoreSchema>) {
  const parsed = CreateStoreSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos", storeId: null };
  }
  const validated = parsed.data;

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_store_complete", {
    p_owner_id: validated.userId,
    p_name: validated.name,
    p_slug: validated.slug,
    p_description: validated.description || null,
    p_currency: validated.currency || "Gs",
    p_whatsapp: validated.whatsapp || null,
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
