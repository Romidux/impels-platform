"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Category } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryStripProps {
  storeSlug: string;
  categories: Category[];
}

export default function CategoryStrip({ storeSlug, categories }: CategoryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Use a small buffer of 2px for precision issues
      setShowLeftIndicator(scrollLeft > 2);
      setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    // Initial check and set up listeners
    checkScroll();
    
    // Check after images/fonts might have loaded
    const timeout = setTimeout(checkScroll, 500);
    
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timeout);
    };
  }, [categories]);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="w-full border-y border-gray-100 bg-white relative">
      <div className="max-w-[1400px] mx-auto relative px-4 sm:px-8">
        
        {/* Left Shadow/Fade Indicator */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-center pl-4 sm:pl-8",
            showLeftIndicator ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Right Shadow/Fade + Chevron Indicator */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none transition-opacity duration-300 flex items-center justify-end pr-4 sm:pr-8",
            showRightIndicator ? "opacity-100" : "opacity-0"
          )}
        >
          <ChevronRight className="w-4 h-4 text-gray-400 animate-pulse" />
        </div>

        <nav 
          ref={scrollRef}
          onScroll={checkScroll}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
          className="flex space-x-8 overflow-x-auto items-center md:justify-center py-4 no-scrollbar [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href={`/store/${storeSlug}/catalog`}
            className="whitespace-nowrap text-xs font-semibold text-black hover:text-gray-500 transition-colors uppercase tracking-[0.2em] flex-shrink-0"
          >
            Todo
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${storeSlug}/catalog?category=${cat.id}`}
              className="whitespace-nowrap text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex-shrink-0"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
