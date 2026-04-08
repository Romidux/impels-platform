import { cache } from "react";
import { createClient } from "./server";

/**
 * Cached per-request helpers. React.cache() deduplicates calls within the
 * same server render, so layout + page share one DB round-trip each.
 */

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getStore = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", userId)
    .single();
  return store;
});
