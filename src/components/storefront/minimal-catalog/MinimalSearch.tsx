"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MinimalSearchProps {
  storeSlug: string;
  storeId: string;
  isMobile?: boolean;
  onSearchComplete?: () => void;
}

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  images?: { url: string }[];
}

export default function MinimalSearch({
  storeSlug,
  storeId,
  isMobile,
  onSearchComplete,
}: MinimalSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, images:product_images(url)")
        .eq("store_id", storeId)
        .eq("visibility", "visible")
        .ilike("name", `%${query}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data as any);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query, storeId]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/store/${storeSlug}/catalog?search=${encodeURIComponent(query.trim())}`);
    setShowSuggestions(false);
    onSearchComplete?.();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    router.push(`/store/${storeSlug}/product/${suggestion.slug}`);
    setShowSuggestions(false);
    onSearchComplete?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Buscar productos, categorías o marcas"
          className={cn(
            "w-full bg-[#f8f8f8] border border-transparent rounded-full py-3.5 pl-11 pr-11 text-sm font-medium focus:outline-none focus:bg-white focus:border-black/10 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.03)] transition-all placeholder:text-black/30",
            isMobile && "py-4 text-base"
          )}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-black/40" />
            </motion.button>
          )}
        </AnimatePresence>
      </form>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && (query.length >= 2 || (suggestions.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-2xl overflow-hidden z-50",
              isMobile && "fixed inset-x-4 top-[80px] mt-0"
            )}
          >
            <div className="p-2">
              {loading && suggestions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black/30">
                    Sugerencias
                  </p>
                  {suggestions.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                        selectedIndex === index ? "bg-black/5" : "hover:bg-black/[0.02]"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-black/5 flex-shrink-0">
                        {item.images && item.images[0] ? (
                          <img 
                            src={item.images[0].url} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="w-4 h-4 text-black/10" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-black truncate flex-1">
                        {item.name}
                      </span>
                    </button>
                  ))}
                  <button 
                    onClick={() => handleSearch()}
                    className="w-full text-center py-3 text-[11px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors border-t border-black/5 mt-2"
                  >
                    Ver todos los resultados para &quot;{query}&quot;
                  </button>
                </div>
              ) : !loading && query.length >= 2 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-black/40 font-medium">No encontramos productos</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
