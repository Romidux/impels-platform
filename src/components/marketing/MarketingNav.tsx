"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Menu,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Cómo funciona", href: "#how-it-works" },
  { label: "Precios", href: "#pricing" },
  { label: "Ejemplos", href: "#examples" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-white/10 shadow-lg py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-gray-900">
            Impels<span className="gradient-text">Commerce</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white gradient-brand px-5 py-2.5 rounded-xl hover:shadow-glow transition-all hover:scale-105"
          >
            Crear tienda gratis
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <Link
                href="/login"
                className="text-gray-700 font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-center font-semibold text-white gradient-brand px-5 py-3 rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Crear tienda gratis
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
