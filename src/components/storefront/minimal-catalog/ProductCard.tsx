import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  currency: string;
}

export default function ProductCard({ product, storeSlug, currency }: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return (
    <Link href={`/store/${storeSlug}/product/${product.slug}`} className="group block w-full space-y-4">
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden w-full">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-1">
        {product.category?.name && (
          <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
            {product.category.name}
          </span>
        )}
        <h3 className="text-base text-gray-900 font-medium tracking-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {formatCurrency(product.price, currency)}
        </p>
      </div>
    </Link>
  );
}
