"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Store as StoreType, StoreSettings, Category } from "@/lib/types";
import MinimalCartDrawer from "./MinimalCartDrawer";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import MinimalCategoryMenuDesktop from "./MinimalCategoryMenuDesktop";
import MinimalCategoryMenuMobile from "./MinimalCategoryMenuMobile";

interface HeaderProps {
  store: StoreType;
  settings?: StoreSettings;
  categories?: Category[];
}

export default function Header({ store, settings, categories = [] }: HeaderProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setStoreSlug = useCartStore((s) => s.setStore);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen || mobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/store/${store.slug}/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[100] w-full transition-all duration-300 ease-in-out",
          scrolled 
            ? "bg-white/80 backdrop-blur-md py-0 shadow-sm border-b border-gray-100/50" 
            : "bg-white py-2"
        )}
      >
        <div className={cn(
          "max-w-[1400px] mx-auto px-4 sm:px-8 flex items-center justify-between relative z-50 transition-all duration-300",
          scrolled ? "h-14" : "h-16"
        )}>
          
          {/* Logo */}
          <Link 
            href={`/store/${store.slug}`} 
            className="flex-shrink-0 flex items-center gap-3 z-50"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSearchOpen(false);
            }}
          >
            <span className="font-medium text-xl tracking-tight text-black line-clamp-1 break-all">
              {store.name}
            </span>
          </Link>

          {/* simple desktop navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <Link href={`/store/${store.slug}`} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
              Inicio
            </Link>
            <MinimalCategoryMenuDesktop categories={categories} storeSlug={store.slug} />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5 flex-shrink-0">
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
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden z-50 flex-shrink-0">
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false);
              }}
              className="text-black"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-black"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
              className="text-black"
            >
              {mobileMenuOpen || mobileSearchOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Panel (Overlay) */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed left-0 right-0 bg-white overflow-hidden shadow-xl z-[110] md:hidden",
              scrolled ? "top-14" : "top-16"
            )}
          >
            <div className="px-4 py-4 border-t border-gray-100 pb-6 border-b">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-full text-base focus:outline-none focus:bg-white focus:border-gray-300 transition-all font-medium placeholder:text-gray-400 shadow-sm"
                  autoFocus
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Navigation Menu (Overlay) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%", transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "fixed inset-0 bg-white z-[120] md:hidden",
              scrolled ? "top-14" : "top-16"
            )}
          >
            <MinimalCategoryMenuMobile 
              categories={categories} 
              storeSlug={store.slug} 
              onClose={() => setMobileMenuOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <MinimalCartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} store={store} settings={settings} />
    </>
  );
}
