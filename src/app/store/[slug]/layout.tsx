import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Script from "next/script";
import TemplateDispatcher from "@/components/storefront/TemplateDispatcher";

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

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

  const template = settings?.template || "modern";

  // Categories are needed for the minimal layout header
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      {settings?.google_analytics_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.google_analytics_id}');
              `,
            }}
          />
        </>
      )}

      {settings?.meta_pixel_id && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${settings.meta_pixel_id}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      <TemplateDispatcher 
        type="layout"
        template={template}
        store={store}
        settings={settings}
        categories={categories || []}
      >
        {children}
      </TemplateDispatcher>
    </>
  );
}
