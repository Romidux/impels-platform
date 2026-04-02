"use client";

import { Category } from "@/lib/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { clearCheckoutSuccess } from "@/lib/hooks/useCheckoutLogic";

interface MinimalCategoryMenuDesktopProps {
  categories: Category[];
  storeSlug: string;
}

export default function MinimalCategoryMenuDesktop({
  categories,
  storeSlug,
}: MinimalCategoryMenuDesktopProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 300);
  };

  const mainCategories = categories.filter((c) => !c.parent_id);
  const subCategoriesMap = categories.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
      acc[cat.parent_id].push(cat);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "text-sm font-medium transition-colors hover:text-black",
          isOpen ? "text-black" : "text-gray-500"
        )}
      >
        Categorías
      </button>

      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-full pt-4 z-[100] transition-all duration-200",
          isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2 pointer-events-none"
        )}
      >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex min-w-[220px]">
              {/* Primary Categories */}
              <div className="py-2 border-r border-gray-50 bg-white min-w-[220px]">
                <Link
                  href={`/store/${storeSlug}/catalog`}
                  onClick={() => clearCheckoutSuccess(storeSlug)}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium border-b border-gray-50 mb-1"
                >
                  Ver todos
                </Link>
                {mainCategories.map((category) => {
                  const hasSubs = subCategoriesMap[category.id]?.length > 0;
                  return (
                    <div
                      key={category.id}
                      onMouseEnter={() => setActiveCategory(category.id)}
                      className="relative"
                    >
                      {hasSubs ? (
                        <div
                          className={cn(
                            "flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors",
                            activeCategory === category.id
                              ? "bg-gray-50 text-black font-semibold"
                              : "text-gray-600 hover:bg-gray-50/50"
                          )}
                        >
                          {category.name}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ) : (
                        <Link
                          href={`/store/${storeSlug}/catalog?category=${category.id}`}
                          onClick={() => clearCheckoutSuccess(storeSlug)}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {category.name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subcategories Panel */}
              {activeCategory && subCategoriesMap[activeCategory] && (
                <div
                  key={activeCategory}
                  className="py-2 bg-gray-50/30 min-w-[220px] animate-in fade-in slide-in-from-left-2 duration-200"
                >
                    <Link
                      href={`/store/${storeSlug}/catalog?category=${activeCategory}`}
                      onClick={() => clearCheckoutSuccess(storeSlug)}
                      className="flex items-center px-6 py-2.5 text-sm text-gray-900 hover:bg-gray-100/50 transition-colors font-semibold mb-1"
                    >
                      Ver todos
                    </Link>
                    {subCategoriesMap[activeCategory].map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/store/${storeSlug}/catalog?category=${sub.id}`}
                        onClick={() => clearCheckoutSuccess(storeSlug)}
                        className="block px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100/50 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
