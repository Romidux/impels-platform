import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import ProductDetailClient from "@/components/storefront/modern/ModernProductDetailClient";
import MinimalProductDetailClient from "@/components/storefront/minimal/MinimalProductDetailClient";
import { Product } from "@/lib/types";
import { getStoreBySlug } from "@/lib/queries/store";

export const revalidate = 60; // ISR cache logic: revalidate every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { slug, productSlug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) return { title: "Producto no encontrado" };

  const { data: product } = await supabase
    .from("products")
    .select("name, description, product_images(url, is_primary)")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .single();

  if (!product) return { title: "Producto no encontrado" };

  const primaryImage = product.product_images?.find((img) => img.is_primary)?.url || product.product_images?.[0]?.url;

  return {
    title: `${product.name} | ${store.name}`,
    description: product.description || `Comprar ${product.name} en ${store.name}`,
    openGraph: {
      title: product.name,
      description: product.description || `Comprar ${product.name} en ${store.name}`,
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || "",
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const supabase = await createClient();
  const { slug, productSlug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

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

  if (settings?.template === "minimal") {
    return (
      <MinimalProductDetailClient
        product={product as Product}
        storeSlug={slug}
        settings={settings}
        relatedProducts={(related as Product[]) || []}
      />
    );
  }

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
