import Link from "next/link";
import { Store as StoreType, StoreSettings } from "@/lib/types";

interface HeroProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function Hero({ store, settings }: HeroProps) {
  const heroTitle = settings?.hero_title || `Colección ${store.name}`;
  const heroSubtitle = settings?.hero_subtitle || "Explora nuestros productos más recientes, diseñados para ti.";

  return (
    <section className="relative w-full px-4 sm:px-8 py-12 md:py-24 bg-gray-50/50 flex flex-col items-center justify-center text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-gray-900 leading-tight">
          {heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
          {heroSubtitle}
        </p>
        <div className="pt-4">
          <Link
            href={`/store/${store.slug}/catalog`}
            className="inline-block bg-black text-white px-8 py-4 text-sm font-medium tracking-wide rounded-full hover:bg-gray-800 transition-colors"
          >
            Ver Colección
          </Link>
        </div>
      </div>
    </section>
  );
}
