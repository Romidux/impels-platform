"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Store as StoreType, StoreSettings, Category } from "@/lib/types";
import MinimalCartDrawer from "./MinimalCartDrawer";
import MinimalSearchOverlay from "./MinimalSearchOverlay";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import MinimalCategoryMenuDesktop from "./MinimalCategoryMenuDesktop";
import MinimalCategoryMenuMobile from "./MinimalCategoryMenuMobile";

import { clearCheckoutSuccess } from "@/lib/hooks/useCheckoutLogic";

interface HeaderProps {
  store: StoreType;
  settings?: StoreSettings;
  categories?: Category[];
}

export default function Header({ store, settings, categories = [] }: HeaderProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Prevent scrolling when mobile menu or search is open
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen, searchOpen]);

  const currency = settings?.currency || "Gs";

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
              setSearchOpen(false);
              clearCheckoutSuccess(store.slug);
            }}
          >
            <span className="font-medium text-xl tracking-tight text-black line-clamp-1 break-all">
              {store.name}
            </span>
          </Link>

          {/* desktop navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <Link 
              href={`/store/${store.slug}`} 
              onClick={() => clearCheckoutSuccess(store.slug)}
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              Inicio
            </Link>
            <MinimalCategoryMenuDesktop categories={categories} storeSlug={store.slug} />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <button 
              onClick={() => setSearchOpen(true)}
              className="text-gray-500 hover:text-black transition-colors p-2"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>
            <button className="text-gray-500 hover:text-black transition-colors p-2">
              <User className="w-5 h-5 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-500 hover:text-black transition-colors p-2"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {mounted && totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden z-50 flex-shrink-0">
            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-black p-2"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-black p-2"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {mounted && totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setSearchOpen(false);
              }}
              className="text-black p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </header>
      
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
      
      <MinimalSearchOverlay 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        storeSlug={store.slug} 
        currency={currency}
      />

      <MinimalCartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} store={store} settings={settings} />
    </>
  );
}

