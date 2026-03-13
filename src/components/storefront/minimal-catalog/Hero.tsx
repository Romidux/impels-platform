import Link from "next/link";
import { Store as StoreType, StoreSettings } from "@/lib/types";

interface HeroProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function Hero({ store, settings }: HeroProps) {
  // Logic to prioritize store name and filter out unwanted default prefixes
  let heroTitle = settings?.hero_title;

  if (!heroTitle || heroTitle.trim() === "" || heroTitle.startsWith("Colección")) {
    heroTitle = store.name;
  }

  const heroSubtitle = settings?.hero_subtitle || "Explora nuestra selección de productos.";

  return (
    <section className="relative w-full px-4 sm:px-8 py-20 md:py-32 bg-white flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-black leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          {heroSubtitle}
        </p>
        <div className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <Link
            href={`/store/${store.slug}/catalog`}
            className="inline-flex items-center justify-center bg-black text-white px-10 py-4 text-sm font-medium tracking-wide rounded-full hover:bg-gray-900 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-lg"
          >
            Ver Productos
          </Link>
        </div>
      </div>
      
      {/* Subtle background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gray-50 rounded-full blur-3xl -z-0 opacity-50" />
    </section>
  );
}
