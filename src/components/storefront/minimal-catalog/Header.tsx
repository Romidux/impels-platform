"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Store as StoreType, StoreSettings } from "@/lib/types";
import CartDrawer from "../CartDrawer";
import { cn } from "@/lib/utils";

interface HeaderProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function Header({ store, settings }: HeaderProps) {
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
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/store/${store.slug}/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-white transition-all duration-300",
          scrolled ? "border-b border-gray-200" : ""
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href={`/store/${store.slug}`} className="flex-shrink-0 flex items-center gap-3">
            <span className="font-medium text-xl tracking-tight text-black">
              {store.name}
            </span>
          </Link>

          {/* simple desktop navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <Link href={`/store/${store.slug}`} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Inicio
            </Link>
            <Link href={`/store/${store.slug}/catalog`} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Catálogo
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            <form onSubmit={handleSearch} className="relative w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
              />
            </form>
            <button className="text-black hover:opacity-70 transition-opacity">
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-black hover:opacity-70 transition-opacity"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Toggle & Actions */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-black"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Expanded */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-6 space-y-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-base focus:outline-none"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-4">
              <Link
                href={`/store/${store.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-black"
              >
                Inicio
              </Link>
              <Link
                href={`/store/${store.slug}/catalog`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-black"
              >
                Catálogo
              </Link>
            </nav>
            <div className="pt-4 border-t border-gray-100 flex items-center gap-3 text-black">
              <User className="w-5 h-5" />
              <span className="font-medium text-base">Mi Cuenta</span>
            </div>
          </div>
        )}
      </header>
      
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} store={store} settings={settings} />
    </>
  );
}
