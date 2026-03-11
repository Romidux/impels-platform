import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetailClient from "@/components/storefront/ProductDetailClient";
import { Product } from "@/lib/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const supabase = await createClient();
  const { slug, productSlug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, store_settings(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = store.store_settings?.[0];

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, images:product_images(*), category:categories(id, name), option_types:product_option_types(*, values:product_option_values(*)), variant_combinations:product_variant_combinations(*)"
    )
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("visibility", "visible")
    .single();

  if (!product) notFound();

  // Fetch related products
  const { data: related } = await supabase
    .from("products")
    .select("*, images:product_images(url, is_primary), category:categories(name)")
    .eq("store_id", store.id)
    .eq("visibility", "visible")
    .eq("category_id", product.category_id || "")
    .neq("id", product.id)
    .limit(4);

  return (
    <ProductDetailClient
      product={product as Product}
      storeSlug={slug}
      settings={settings}
      relatedProducts={related || []}
      whatsappNumber={settings?.whatsapp_number}
    />
  );
}
