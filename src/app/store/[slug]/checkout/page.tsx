import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutPageClient from "@/components/storefront/CheckoutPageClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, store_settings(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) notFound();

  const settings = store.store_settings?.[0];

  return (
    <CheckoutPageClient
      storeId={store.id}
      storeSlug={slug}
      whatsappNumber={settings?.whatsapp_number}
      currency={settings?.currency || "Gs"}
      primaryColor={settings?.primary_color || "#2563eb"}
    />
  );
}
