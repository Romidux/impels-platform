import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Product, Category } from "@/lib/types";
import TemplateDispatcher from "@/components/storefront/TemplateDispatcher";
import { getStoreBySlug, getStoreCategories } from "@/lib/queries/store";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug); // Cached — reuses layout result

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

  // Fetch categories (cached)
  const categories = await getStoreCategories(store.id, true); // parent only

  // Fetch featured and recent products (these are page-specific, not cached globally)
  const supabase = await createClient();

  const [{ data: featuredProducts }, { data: recentProducts }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, images:product_images(url, is_primary), category:categories(name)"
      )
      .eq("store_id", store.id)
      .eq("visibility", "visible")
      .eq("is_featured", true)
      .limit(8)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(
        "*, images:product_images(url, is_primary), category:categories(name)"
      )
      .eq("store_id", store.id)
      .eq("visibility", "visible")
      .limit(12)
      .order("created_at", { ascending: false }),
  ]);

  const template = settings?.template || "modern";

  return (
    <TemplateDispatcher
      type="page"
      template={template}
      store={store}
      settings={settings}
      categories={(categories as Category[]) || []}
      featuredProducts={(featuredProducts as Product[]) || []}
      recentProducts={(recentProducts as Product[]) || []}
    />
  );
}
