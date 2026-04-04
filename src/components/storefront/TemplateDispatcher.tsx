import { Store, StoreSettings, StoreBranding, Category, Product } from "@/lib/types";
import dynamic from "next/dynamic";

const TemplateFallback = () => (
  <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center animate-pulse">
    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-400 animate-spin"></div>
  </div>
);

// Dynamic imports — only loads the template code the store actually uses
const MinimalLayout = dynamic(() => import("./minimal/MinimalLayout"), { loading: () => <TemplateFallback /> });
const MinimalHomePage = dynamic(() => import("./minimal/MinimalHomePage"), { loading: () => <TemplateFallback /> });
const ModernLayout = dynamic(() => import("./modern/ModernLayout"), { loading: () => <TemplateFallback /> });
const ModernHomePage = dynamic(() => import("./modern/ModernHomePage"), { loading: () => <TemplateFallback /> });
const MinimalCatalogPageClient = dynamic(() => import("./minimal-catalog/MinimalCatalogPageClient"), { loading: () => <TemplateFallback /> });

type TemplateType = "minimal" | "modern" | "brand";

interface TemplateDispatcherProps {
  template: TemplateType;
  store: Store;
  settings?: StoreSettings;
  branding?: StoreBranding;
  categories?: Category[];
  featuredProducts?: Product[];
  recentProducts?: Product[];
  allProducts?: Product[]; // For catalog page
  children?: React.ReactNode;
  type: "layout" | "page" | "catalog";
}

export default function TemplateDispatcher({
  template,
  store,
  settings,
  branding,
  categories = [],
  featuredProducts = [],
  recentProducts = [],
  allProducts = [],
  children,
  type,
}: TemplateDispatcherProps) {
  if (type === "layout") {
    switch (template) {
      case "minimal":
        return (
          <MinimalLayout store={store} settings={settings} branding={branding} categories={categories}>
            {children}
          </MinimalLayout>
        );
      case "brand":
        // Fallback to modern until brand is fully implemented
        return (
          <ModernLayout store={store} settings={settings}>
            {children}
          </ModernLayout>
        );
      case "modern":
      default:
        return (
          <ModernLayout store={store} settings={settings} branding={branding}>
            {children}
          </ModernLayout>
        );
    }
  }

  if (type === "page") {
    switch (template) {
      case "minimal":
        return (
          <MinimalHomePage
            store={store}
            settings={settings}
            branding={branding}
            categories={categories}
            featuredProducts={featuredProducts}
            recentProducts={recentProducts}
          />
        );
      case "brand":
        // Fallback to modern until brand is fully implemented
        return (
          <ModernHomePage
            store={store}
            settings={settings}
            categories={categories}
            featuredProducts={featuredProducts}
            recentProducts={recentProducts}
          />
        );
      case "modern":
      default:
        return (
          <ModernHomePage
            store={store}
            settings={settings}
            branding={branding}
            categories={categories}
            featuredProducts={featuredProducts}
            recentProducts={recentProducts}
          />
        );
    }
  }

  if (type === "catalog") {
    switch (template) {
      case "minimal":
        return (
          <MinimalCatalogPageClient
            store={store}
            settings={settings}
            categories={categories}
            initialProducts={allProducts}
          />
        );
      // Modern and Brand reuse Minimal catalog until bespoke versions ship
      case "modern":
      case "brand":
      default:
        return (
          <MinimalCatalogPageClient
            store={store}
            settings={settings}
            categories={categories}
            initialProducts={allProducts}
          />
        );
    }
  }

  return null;
}
