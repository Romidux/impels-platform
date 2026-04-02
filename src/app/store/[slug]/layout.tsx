import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import TemplateDispatcher from "@/components/storefront/TemplateDispatcher";
import { getStoreBySlug, getStoreCategories } from "@/lib/queries/store";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug); // Cached — same call in layout won't hit DB again

  if (!store) return { title: "Tienda no encontrada" };

  const branding = Array.isArray(store.store_branding)
    ? store.store_branding[0]
    : store.store_branding;

  // Fallback if the layout doesn't have a logo: public generic shop image or default UI.
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://impels.com";
  const ogImage = branding?.logo_url || `${origin}/og-fallback.png`;

  return {
    title: `${store.name} | Tienda Online`,
    description: store.description || `Bienvenido a la tienda online de ${store.name}`,
    openGraph: {
      title: `${store.name} | Tienda Online`,
      description: store.description || `Bienvenido a la tienda online de ${store.name}`,
      type: "website",
      siteName: store.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Logo de ${store.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description: store.description || `Tienda online de ${store.name}`,
      images: [ogImage],
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
  const { slug } = await params;
  const store = await getStoreBySlug(slug); // Cached — reuses result from generateMetadata

  if (!store) notFound();

  const settings = Array.isArray(store.store_settings) 
    ? store.store_settings[0] 
    : store.store_settings;

  const template = settings?.template || "modern";

  // Categories are needed for the minimal layout header
  const categories = await getStoreCategories(store.id);

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
