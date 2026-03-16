"use client";

import { Category } from "@/lib/types";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { clearCheckoutSuccess } from "@/lib/hooks/useCheckoutLogic";

interface MinimalCategoryMenuMobileProps {
  categories: Category[];
  storeSlug: string;
  onClose: () => void;
}

// Special token to identify the root "Categories" level in history
const CATEGORIES_ROOT = "CATEGORIES_ROOT";

export default function MinimalCategoryMenuMobile({
  categories,
  storeSlug,
  onClose,
}: MinimalCategoryMenuMobileProps) {
  const [history, setHistory] = useState<string[]>([]);

  // Current view state
  const isMainMenu = history.length === 0;
  const isCategoriesRoot = history.length === 1 && history[0] === CATEGORIES_ROOT;
  const activeCategoryId = history.length > 1 ? history[history.length - 1] : null;

  // Determine what to display based on history level
  let currentItems: any[] = [];
  let title = "Menú";

  if (isMainMenu) {
    title = "Menú";
  } else if (isCategoriesRoot) {
    title = "Categorías";
    currentItems = categories.filter((c) => !c.parent_id);
  } else if (activeCategoryId) {
    const activeCategory = categories.find(c => c.id === activeCategoryId);
    title = activeCategory?.name || "Categorías";
    currentItems = categories.filter((c) => c.parent_id === activeCategoryId);
  }

  const subCategoriesMap = categories.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
      acc[cat.parent_id].push(cat);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  const handleBack = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleForward = (id: string) => {
    setHistory((prev) => [...prev, id]);
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center h-16 px-6 border-b border-gray-100 flex-shrink-0">
        {!isMainMenu && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-black hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            {title}
          </span>
        </div>
        {!isMainMenu && <div className="w-9" />} {/* Balance for centering */}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col py-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={history.join("-") || "root"}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="px-6"
            >
              {/* LEVEL 1: Main Menu */}
              {isMainMenu && (
                <div className="space-y-1">
                  <Link
                    href={`/store/${storeSlug}`}
                    onClick={() => {
                      onClose();
                      clearCheckoutSuccess(storeSlug);
                    }}
                    className="flex items-center justify-between py-5 border-b border-gray-50 group"
                  >
                    <span className="text-xl font-medium text-black">Inicio</span>
                  </Link>
                  <button
                    onClick={() => handleForward(CATEGORIES_ROOT)}
                    className="flex items-center justify-between w-full py-5 border-b border-gray-50 text-left group"
                  >
                    <span className="text-xl font-medium text-black">Categorías</span>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
              )}

              {/* LEVEL 2 & 3: Categories & Subcategories */}
              {!isMainMenu && (
                <div className="space-y-1">
                  {/* "Ver todos" option */}
                  <Link
                    href={
                      activeCategoryId
                        ? `/store/${storeSlug}/catalog?category=${activeCategoryId}`
                        : `/store/${storeSlug}/catalog`
                    }
                    onClick={() => {
                      onClose();
                      clearCheckoutSuccess(storeSlug);
                    }}
                    className="flex items-center justify-between py-5 border-b border-gray-50 group"
                  >
                    <span className="text-xl font-medium text-black italic opacity-60">
                      Ver todos
                    </span>
                  </Link>

                  {currentItems.map((category) => {
                    const hasSubs = subCategoriesMap[category.id]?.length > 0;
                    return (
                      <div key={category.id}>
                        {hasSubs ? (
                          <button
                            onClick={() => handleForward(category.id)}
                            className="flex items-center justify-between w-full py-5 border-b border-gray-50 text-left group"
                          >
                            <span className="text-xl font-medium text-black">
                              {category.name}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                          </button>
                        ) : (
                          <Link
                            href={`/store/${storeSlug}/catalog?category=${category.id}`}
                            onClick={() => {
                              onClose();
                              clearCheckoutSuccess(storeSlug);
                            }}
                            className="flex items-center justify-between py-5 border-b border-gray-50 group"
                          >
                            <span className="text-xl font-medium text-black">
                              {category.name}
                            </span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
