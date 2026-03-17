"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface MinimalCatalogProductCardProps {
  product: Product;
  storeSlug: string;
  currency: string;
}

export default function MinimalCatalogProductCard({
  product,
  storeSlug,
  currency,
}: MinimalCatalogProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasSale = product.compare_at_price && product.compare_at_price > product.price;
  const outOfStock = product.track_inventory && product.stock_status === "out_of_stock";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative"
    >
      <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-50 rounded-sm">
          {/* Product Image */}
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-in-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-300">
              <span className="text-xs uppercase tracking-widest font-light italic">Sin imagen</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {outOfStock ? (
              <span className="bg-neutral-50/90 backdrop-blur-sm text-neutral-400 text-[9px] font-medium px-2 py-0.5 rounded-md uppercase tracking-[0.12em] border border-neutral-100/50 shadow-none">
                Agotado
              </span>
            ) : hasSale ? (
              <span className="bg-rose-50/95 backdrop-blur-sm text-rose-700 text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-[0.12em] border border-rose-100 shadow-none">
                Oferta
              </span>
            ) : product.is_featured ? (
              <span className="bg-neutral-900 text-white text-[9px] font-medium px-2.5 py-0.5 rounded-md uppercase tracking-[0.12em] shadow-sm">
                Destacado
              </span>
            ) : null}
          </div>



          {/* Overlay Action (Visual only for premium feel) */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-gradient-to-t from-black/20 to-transparent">
             <div className="w-full py-2.5 bg-white text-neutral-900 text-center text-xs font-medium uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
               Ver Detalle
             </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 px-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[14px] text-neutral-800 font-normal leading-tight tracking-tight group-hover:text-black transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>
          
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[15px] font-medium text-neutral-900">
              {formatCurrency(product.price, currency)}
            </span>
            {hasSale && (
              <span className="text-xs text-neutral-400 line-through font-light">
                {formatCurrency(product.compare_at_price!, currency)}
              </span>
            )}
          </div>

          {product.category?.name && (
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest mt-0.5">
              {product.category.name}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
