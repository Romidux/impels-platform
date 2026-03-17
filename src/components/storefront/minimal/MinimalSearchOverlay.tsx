"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MinimalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  currency: string;
}

export default function MinimalSearchOverlay({
  isOpen,
  onClose,
  storeSlug,
  currency,
}: MinimalSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*, images:product_images(url, is_primary)")
        .eq("visibility", "visible")
        .ilike("name", `%${query}%`)
        .limit(5);
      
      if (data) setResults(data as Product[]);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/store/${storeSlug}/catalog?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-md flex flex-col items-center pt-[15vh] px-6"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-neutral-400 hover:text-black transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <X className="w-6 h-6 stroke-[1.2]" />
          </button>

          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="w-full mb-12">
              <div className="relative border-b border-neutral-200 pb-3 flex items-center group transition-colors focus-within:border-neutral-900">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full bg-transparent text-2xl sm:text-4xl font-light tracking-[0.12em] uppercase focus:outline-none placeholder:text-neutral-200"
                />
                <button 
                  type="submit" 
                  className={query.trim() ? "text-neutral-900" : "text-neutral-200"}
                  disabled={!query.trim()}
                >
                  <ArrowRight className="w-8 h-8 stroke-[1.2]" />
                </button>
              </div>
            </form>

            {/* Results Preview */}
            <div className="w-full flex flex-col gap-8 min-h-[200px]">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-neutral-100 border-t-neutral-900 rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-semibold mb-6">
                    Sugerencias
                  </p>
                  <div className="grid gap-6">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/store/${storeSlug}/product/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-6 group/item"
                      >
                        <div className="w-16 h-20 bg-neutral-50 overflow-hidden rounded-sm flex-shrink-0">
                          {product.images?.[0] && (
                            <img 
                              src={product.images.find(i => i.is_primary)?.url || product.images[0].url} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-neutral-800 tracking-tight group-hover/item:text-black transition-colors">
                            {product.name}
                          </span>
                          <span className="text-xs text-neutral-400 font-light italic">
                            {formatCurrency(product.price, currency)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleSubmit}
                    className="group mt-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-900 hover:opacity-70 transition-all pt-4 border-t border-neutral-100 w-full"
                  >
                    Ver todos los resultados 
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              ) : query.trim().length >= 2 ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-neutral-400 text-sm italic font-light py-10"
                >
                  No se encontraron productos para "{query}"
                </motion.p>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
