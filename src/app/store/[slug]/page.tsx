import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Product, Category } from "@/lib/types";
import TemplateDispatcher from "@/components/storefront/TemplateDispatcher";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*), store_branding(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store.id)
    .is("parent_id", null)
    .eq("is_active", true)
    .limit(6)
    .order("sort_order");

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)"
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .eq("is_featured", true)
    .limit(8)
    .order("created_at", { ascending: false });

  // Fetch recent products
  const { data: recentProducts } = await supabase
    .from("products")
    .select(
      "*, images:product_images(url, is_primary), category:categories(name)"
    )
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .limit(12)
    .order("created_at", { ascending: false });

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
