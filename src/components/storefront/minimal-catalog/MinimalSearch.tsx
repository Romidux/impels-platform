"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MinimalSearchProps {
  storeSlug: string;
  storeId: string;
  isMobile?: boolean;
  onSearchComplete?: () => void;
}

export default function MinimalSearch({
  storeSlug,
  storeId,
  isMobile,
  onSearchComplete,
}: MinimalSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus effect for mobile
  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  // Debounce and Fetch Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("products")
            .select("*, images:product_images(url, is_primary)")
            .eq("store_id", storeId)
            .eq("visibility", "visible")
            .ilike("name", `%${query.trim()}%`)
            .limit(5);

          if (!error && data) {
            setSuggestions(data as Product[]);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error("Error fetching suggestions:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, storeId, supabase]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      router.push(`/store/${storeSlug}/catalog?search=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      onSearchComplete?.();
    }
  };

  const handleSuggestionClick = (productSlug: string) => {
    router.push(`/store/${storeSlug}/product/${productSlug}`);
    setShowSuggestions(false);
    onSearchComplete?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        handleSuggestionClick(suggestions[focusedIndex].slug);
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", isMobile ? "px-2" : "max-w-md")}>
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center">
          <Search className={cn(
            "absolute left-4 w-4 h-4 transition-colors duration-200",
            showSuggestions ? "text-black" : "text-gray-400 group-focus-within:text-black"
          )} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder="Buscar productos, categorías o marcas"
            className={cn(
              "w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-100 rounded-full text-sm font-medium",
              "transition-all duration-300 focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5",
              isMobile ? "text-base py-4" : "text-sm",
              "placeholder:text-gray-400 placeholder:font-normal"
            )}
          />

          <div className="absolute right-3 flex items-center gap-1">
            {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={clearSearch}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (query.length >= 2) && (suggestions.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute z-50 left-0 right-0 mt-2 bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden",
              isMobile ? "mx-2" : ""
            )}
          >
            <div className="py-2">
              <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50 mb-1">
                Sugerencias
              </p>
              
              <div className="max-h-[350px] overflow-y-auto">
                {suggestions.map((product, index) => {
                  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product.slug)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-4 px-5 py-3 transition-colors text-left",
                        focusedIndex === index ? "bg-gray-50" : "hover:bg-gray-50/50"
                      )}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-50">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-black truncate uppercase tracking-tight">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-[11px] text-gray-400 font-medium truncate">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                      
                      {focusedIndex === index && (
                        <motion.div
                          layoutId="active-indicator"
                          className="w-1.5 h-1.5 rounded-full bg-black"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <button
                  onClick={() => handleSearch()}
                  className="w-full py-2.5 text-xs font-bold text-center text-gray-500 hover:text-black transition-colors uppercase tracking-widest"
                >
                  Ver todos los resultados para "{query}"
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
