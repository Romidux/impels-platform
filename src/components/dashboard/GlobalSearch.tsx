"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Package, ShoppingCart, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function GlobalSearch({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ type: string; item: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // When opened, focus input
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const st = `%${query}%`;
      
      try {
        // Parallel fetch over 3 tables
        const [
          { data: products },
          { data: orders },
          { data: customers },
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, slug")
            .eq("store_id", storeId)
            .ilike("name", st)
            .limit(5),
          supabase
            .from("orders")
            .select("id, customer_name, customer_phone")
            .eq("store_id", storeId)
            .ilike("customer_name", st)
            .limit(5),
          supabase
            .from("customers")
            .select("id, full_name, email")
            .eq("store_id", storeId)
            .ilike("full_name", st)
            .limit(5),
        ]);

        const formatted = [
          ...(products || []).map((p) => ({ type: "product", item: p })),
          ...(orders || []).map((o) => ({ type: "order", item: o })),
          ...(customers || []).map((c) => ({ type: "customer", item: c })),
        ];

        setResults(formatted);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query, storeId]);

  const handleSelect = (result: { type: string; item: any }) => {
    setOpen(false);
    if (result.type === "product") {
      router.push(`/dashboard/products/${result.item.id}`);
    } else if (result.type === "order") {
      router.push(`/dashboard/orders/${result.item.id}`);
    } else if (result.type === "customer") {
      router.push(`/dashboard/customers`);
    }
  };

  return (
    <>
      {/* Fake Search Bar Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-sm transition-colors border border-transparent hover:border-gray-200 w-64"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left">Buscar órdenes, prod...</span>
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded shadow-sm">
          <span className="text-xs mr-0.5">⌘</span>K
        </kbd>
      </button>

      {/* Mobile Search Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed left-1/2 top-20 md:top-32 -translate-x-1/2 w-[90%] md:w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[101]"
            >
              {/* Search Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar productos, clientes, pedidos..."
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-base py-2 placeholder-gray-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                  }}
                />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results Body */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {!query.trim() && (
                  <div className="p-8 text-center text-sm text-gray-500">
                    Escribe para empezar a buscar.
                  </div>
                )}

                {query.trim() && loading && results.length === 0 && (
                  <div className="p-8 flex justify-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}

                {query.trim() && !loading && results.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No hay resultados para "{query}"
                  </div>
                )}

                {results.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {results.map((result, idx) => (
                      <button
                        key={`${result.type}-${result.item.id}`}
                        onClick={() => handleSelect(result)}
                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-brand-50 rounded-xl group transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600">
                          {result.type === "product" && <Package className="w-4 h-4" />}
                          {result.type === "order" && <ShoppingCart className="w-4 h-4" />}
                          {result.type === "customer" && <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 truncate">
                            {result.type === "product" && result.item.name}
                            {result.type === "order" && `${result.item.customer_name} (Pedido)`}
                            {result.type === "customer" && `${result.item.full_name} (Cliente)`}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {result.type === "product" && `Slug: ${result.item.slug}`}
                            {result.type === "order" && `Tel: ${result.item.customer_phone}`}
                            {result.type === "customer" && `Email: ${result.item.email || "No email"}`}
                          </p>
                        </div>
                        {result.type === "order" && (
                          <div className="text-xs font-mono text-gray-400">
                            #{result.item.id.slice(0, 8).toUpperCase()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
