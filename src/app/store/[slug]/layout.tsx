import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import MinimalLayout from "@/components/storefront/minimal-catalog/MinimalLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: store } = await supabase
    .from("stores")
    .select("name, description, store_branding(*), store_settings(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!store) return { title: "Tienda no encontrada" };

  return {
    title: store.name,
    description: store.description || `Tienda online de ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description || `Tienda online de ${store.name}`,
      type: "website",
    },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const settings = store.store_settings?.[0];

  if (settings?.template === "minimal") {
    return (
      <MinimalLayout store={store} settings={settings}>
        {children}
      </MinimalLayout>
    );
  }

  return (
    <StorefrontLayout store={store} settings={settings}>
      {children}
    </StorefrontLayout>
  );
}
