import ProductCard from "./ProductCard";
import { Product } from "@/lib/types";
import { Package } from "lucide-react";

interface ProductGridProps {
  title?: string;
  products: Product[];
  storeSlug: string;
  currency: string;
}

export default function ProductGrid({ title, products, storeSlug, currency }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 w-full">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Por el momento no hay productos en esta sección.</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-16">
      {title && (
        <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-10">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeSlug={storeSlug}
            currency={currency}
          />
        ))}
      </div>
    </section>
  );
}
