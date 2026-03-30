import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached store fetch — React cache() deduplicates calls within the same
 * server render tree, so layout + page + generateMetadata all share ONE query.
 */
export const getStoreBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("*, store_settings(*), store_branding(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
});

/**
 * Cached categories fetch for a store.
 */
export const getStoreCategories = cache(async (storeId: string, parentOnly = false) => {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order");

  if (parentOnly) {
    query = query.is("parent_id", null);
  }

  const { data } = await query;
  return data;
});
