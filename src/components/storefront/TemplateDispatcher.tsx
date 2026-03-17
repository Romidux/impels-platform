import { Store, StoreSettings, StoreBranding, Category, Product } from "@/lib/types";
import MinimalLayout from "./minimal/MinimalLayout";
import MinimalHomePage from "./minimal/MinimalHomePage";
import ModernLayout from "./modern/ModernLayout";
import ModernHomePage from "./modern/ModernHomePage";
import MinimalCatalogPageClient from "./minimal-catalog/MinimalCatalogPageClient";

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
      // Other templates can still use the generic version for now
      // or we can implement their specific views here.
      // Since they were rendering in the page.tsx before,
      // we'll need to define a fallback or use the existing page.tsx logic.
      default:
        return null; // The page.tsx will handle the default if dispatcher returns null
    }
  }

  return null;
}

