import { Store, StoreSettings, StoreBranding, Category, Product } from "@/lib/types";
import MinimalLayout from "./minimal/MinimalLayout";
import MinimalHomePage from "./minimal/MinimalHomePage";
import ModernLayout from "./modern/ModernLayout";
import ModernHomePage from "./modern/ModernHomePage";

type TemplateType = "minimal" | "modern" | "brand";

interface TemplateDispatcherProps {
  template: TemplateType;
  store: Store;
  settings?: StoreSettings;
  branding?: StoreBranding;
  categories?: Category[];
  featuredProducts?: Product[];
  recentProducts?: Product[];
  children?: React.ReactNode;
  type: "layout" | "page";
}

export default function TemplateDispatcher({
  template,
  store,
  settings,
  branding,
  categories = [],
  featuredProducts = [],
  recentProducts = [],
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

  return null;
}
