import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ModernCheckoutPageClient from "@/components/storefront/modern/ModernCheckoutPageClient";
import MinimalCheckoutPageClient from "@/components/storefront/minimal/MinimalCheckoutPageClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

  const template = settings?.template || "modern";

  if (template === "minimal") {
    return (
      <MinimalCheckoutPageClient
        storeId={store.id}
        storeSlug={slug}
        whatsappNumber={settings?.whatsapp_number}
        currency={settings?.currency || "Gs"}
        primaryColor={settings?.primary_color || "#000000"}
      />
    );
  }

  return (
    <ModernCheckoutPageClient
      storeId={store.id}
      storeSlug={slug}
      whatsappNumber={settings?.whatsapp_number}
      currency={settings?.currency || "Gs"}
      primaryColor={settings?.primary_color || "#2563eb"}
    />
  );
}
