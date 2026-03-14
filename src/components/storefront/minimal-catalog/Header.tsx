"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { Store as StoreType, StoreSettings, StoreBranding } from "@/lib/types";
import { cn } from "@/lib/utils";
import MinimalSearch from "./MinimalSearch";

interface HeaderProps {
  store: StoreType;
  settings?: StoreSettings;
  branding?: StoreBranding;
  onCartOpen: () => void;
}

export default function Header({
  store,
  settings,
  branding,
  onCartOpen,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalItems = useCartStore((s) => s.getTotalItems());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white transition-all duration-300",
        scrolled ? "shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border-b border-transparent py-2" : "border-b border-gray-50 py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-8">
        {/* Logo/Name */}
        <Link
          href={`/store/${store.slug}`}
          className="flex items-center gap-3 flex-shrink-0 group"
        >
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white font-black text-xl">
              {store.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-display font-black text-xl text-black tracking-tighter hidden sm:block">
            {store.name}
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="flex-1 max-w-lg hidden md:block">
          <MinimalSearch storeSlug={store.slug} storeId={store.id} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/store/${store.slug}/catalog`}
            className="hidden lg:flex text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black px-4 py-2 rounded-full transition-colors"
          >
            Catálogo
          </Link>

          {/* Cart button */}
          <button
            onClick={onCartOpen}
            className="relative p-3 rounded-full hover:bg-gray-50 transition-all active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 text-black" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-full hover:bg-gray-50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-black" />
            ) : (
              <Menu className="w-5 h-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile search & menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 px-4 py-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-6">
            <MinimalSearch 
              storeSlug={store.slug} 
              storeId={store.id} 
              isMobile={true} 
              onSearchComplete={() => setMobileMenuOpen(false)}
            />
          </div>
          
          <nav className="space-y-1">
            <Link
              href={`/store/${store.slug}/catalog`}
              className="block w-full text-center py-4 text-sm font-bold uppercase tracking-widest text-black border-2 border-black rounded-2xl hover:bg-black hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ver catálogo completo
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
