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
    <Link 
      href={`/store/${storeSlug}/product/${product.slug}`} 
      className="group block w-full space-y-4 transition-all duration-500 ease-out hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden w-full rounded-sm shadow-sm transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-black/5">
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.track_inventory && product.stock_status === "out_of_stock" ? (
            <span className="bg-neutral-50/90 backdrop-blur-sm text-neutral-400 text-[9px] font-medium px-2 py-0.5 rounded-md uppercase tracking-[0.12em] border border-neutral-100/50 shadow-none">
              Agotado
            </span>
          ) : product.compare_at_price && product.compare_at_price > product.price ? (
            <span className="bg-rose-50/95 backdrop-blur-sm text-rose-700 text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-[0.12em] border border-rose-100 shadow-none">
              Oferta
            </span>
          ) : product.is_featured ? (
            <span className="bg-neutral-900 text-white text-[9px] font-medium px-2.5 py-0.5 rounded-md uppercase tracking-[0.12em] shadow-sm">
              Destacado
            </span>
          ) : null}
        </div>


        {primaryImage ? (

          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        {product.category?.name && (
          <span className="text-[10px] text-gray-400 font-semibold tracking-[0.1em] uppercase">
            {product.category.name}
          </span>
        )}
        <h3 className="text-[15px] text-gray-900 font-medium tracking-tight line-clamp-2 leading-snug group-hover:text-black transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 font-light mt-0.5">
          {formatCurrency(product.price, currency)}
        </p>
      </div>
    </Link>
  );
}
