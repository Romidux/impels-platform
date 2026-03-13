"use client";

import Link from "next/link";
import { ShoppingCart, Search, Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Store as StoreType, StoreSettings, StoreBranding } from "@/lib/types";
import CartDrawer from "./CartDrawer";
import { cn } from "@/lib/utils";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  store: StoreType;
  settings?: StoreSettings;
  branding?: StoreBranding;
}

export default function StorefrontLayout({
  children,
  store,
  settings,
  branding,
}: StorefrontLayoutProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setStoreSlug = useCartStore((s) => s.setStore);
  const router = useRouter();

  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const primaryColor = settings?.primary_color || "#2563eb";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Store Header */}
      <header
        className={cn(
          "sticky top-0 z-40 bg-white transition-shadow",
          scrolled ? "shadow-md" : "border-b border-gray-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo/Name */}
          <Link
            href={`/store/${store.slug}`}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white font-bold text-lg">
                {store.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-display font-bold text-lg text-gray-900 hidden sm:block">
              {store.name}
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/store/${store.slug}/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/store/${store.slug}/catalog`}
              className="hidden sm:flex text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Catálogo
            </Link>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/store/${store.slug}/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                  setMobileMenuOpen(false);
                }
              }}
              className="mb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none"
                />
              </div>
            </form>
            <Link
              href={`/store/${store.slug}/catalog`}
              className="block text-sm font-medium text-gray-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ver catálogo completo
            </Link>
          </div>
        )}
      </header>

      {/* Benefits Bar (Marquee) - ONLY MINIMAL */}
      {settings?.template === "minimal" && settings.benefits_bar_items && settings.benefits_bar_items.length > 0 && (
        <div className="bg-black text-white h-[40px] flex items-center overflow-hidden whitespace-nowrap border-y border-white/10">
          <div className="flex animate-marquee-fast md:animate-marquee-slow hover:[animation-play-state:paused]">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] px-4">
                {settings.benefits_bar_items!.filter(b => b.trim() !== "").join(" • ")}
                {i < 4 && " • "}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {settings?.template === "minimal" ? (
        <footer className="bg-white border-t border-gray-100 mt-12 pt-12 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
              {/* Col 1: Store Name */}
              <div className="space-y-4">
                <Link href={`/store/${store.slug}`} className="font-display font-black text-xl tracking-tight text-black">
                  {store.name}
                </Link>
                <p className="text-gray-400 text-sm max-w-[240px]">
                  {settings.hero_subtitle || store.description}
                </p>
              </div>

              {/* Col 2: Navigation */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400">{branding?.footer_categories_label || "Explorar"}</h4>
                <div className="flex flex-col gap-2.5">
                  <Link href={`/store/${store.slug}/catalog`} className="text-sm font-medium hover:underline">Productos</Link>
                  <Link href={`/store/${store.slug}/catalog`} className="text-sm font-medium hover:underline">Categorías</Link>
                  <Link href={`/store/${store.slug}`} className="text-sm font-medium hover:underline">{branding?.footer_contact_label || "Contacto"}</Link>
                </div>
              </div>

              {/* Col 3: Social */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400">Social</h4>
                <div className="flex flex-col gap-2.5">
                  {settings.instagram_url && (
                    <a href={settings.instagram_url} target="_blank" rel="noopener" className="text-sm font-medium hover:underline">
                      Instagram
                    </a>
                  )}
                  {settings.whatsapp_number && (
                    <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener" className="text-sm font-medium hover:underline">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-medium">
              <p>© 2026 {store.name} · Powered by <Link href="https://impels-platform.vercel.app" target="_blank" rel="noopener noreferrer" className="underline text-black">Impels</Link></p>
              <div className="flex gap-6">
                <span>POLÍTICA DE PRIVACIDAD</span>
                <span>TÉRMINOS Y CONDICIONES</span>
              </div>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-gray-50 border-t border-gray-100 mt-8">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-bold text-sm">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-display font-bold text-gray-900">
                  {store.name}
                </span>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                Tienda creada con{" "}
                <Link
                  href="/"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-semibold"
                >
                  <Zap className="w-3 h-3" />
                  Impels Commerce
                </Link>
              </div>
            </div>
            {settings?.whatsapp_number && (
              <div className="mt-4 text-center">
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  📞 Contactar por WhatsApp
                </a>
              </div>
            )}
          </div>
        </footer>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        store={store}
        settings={settings}
      />
    </div>
  );
}
