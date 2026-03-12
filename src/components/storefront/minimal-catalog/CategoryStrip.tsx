import Link from "next/link";
import { Category } from "@/lib/types";

interface CategoryStripProps {
  storeSlug: string;
  categories: Category[];
}

export default function CategoryStrip({ storeSlug, categories }: CategoryStripProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="w-full border-y border-gray-100 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4">
        <nav className="flex space-x-8 overflow-x-auto no-scrollbar items-center md:justify-center">
          <Link
            href={`/store/${storeSlug}/catalog`}
            className="whitespace-nowrap text-sm font-medium text-black hover:text-gray-500 transition-colors uppercase tracking-wider flex-shrink-0"
          >
            Todo
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${storeSlug}/catalog?category=${cat.id}`}
              className="whitespace-nowrap text-sm font-medium text-gray-500 hover:text-black transition-colors uppercase tracking-wider flex-shrink-0"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
