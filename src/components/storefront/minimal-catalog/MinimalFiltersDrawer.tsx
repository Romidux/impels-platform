"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Category } from "@/lib/types";

interface MinimalFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  primaryColor: string;
}

export default function MinimalFiltersDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  primaryColor,
}: MinimalFiltersDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelect = (id: string | null) => {
    onSelectCategory(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[300]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] bg-white shadow-2xl z-[310] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-8 border-b border-neutral-50">
              <h2 className="text-xl font-medium tracking-tight text-neutral-900">
                Filtros
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-neutral-400 hover:text-black transition-colors"
              >
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-10">
              <div className="space-y-12">
                {/* Categories */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-6">
                    Categorías
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleSelect(null)}
                      className={`flex items-center justify-between py-3 text-sm transition-all ${
                        !selectedCategoryId ? "text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      <span>Todas las Colecciones</span>
                      {!selectedCategoryId && <Check className="w-4 h-4" style={{ color: primaryColor }} />}
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleSelect(category.id)}
                        className={`flex items-center justify-between py-3 text-sm transition-all ${
                          selectedCategoryId === category.id ? "text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        <span>{category.name}</span>
                        {selectedCategoryId === category.id && (
                          <Check className="w-4 h-4" style={{ color: primaryColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional filters could be added here (Price range, color, etc.) */}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-8 border-t border-neutral-50">
               <button
                 onClick={onClose}
                 className="w-full py-4 bg-neutral-900 text-white text-[12px] uppercase tracking-[0.15em] font-medium hover:bg-black transition-all"
               >
                 Ver Resultados
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
