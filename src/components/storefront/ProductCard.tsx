"use client";

import Link from "next/link";
import { ShoppingCart, Eye } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  primaryColor: string;
  currency: string;
}

export default function ProductCard({
  product,
  storeSlug,
  primaryColor,
  currency,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const isOutOfStock = product.stock_status === "out_of_stock";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: primaryImage?.url,
      product_slug: product.slug,
      price: product.price,
      quantity: 1,
    });

    setAdded(true);
    toast.success(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="group block"
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock && (
              <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                Sin stock
              </span>
            )}
            {product.is_featured && !isOutOfStock && (
              <span
                className="text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Destacado
              </span>
            )}
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Oferta
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md ${
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : added
                    ? "bg-green-500"
                    : ""
              }`}
              style={!isOutOfStock && !added ? { backgroundColor: primaryColor } : {}}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isOutOfStock ? "Sin stock" : added ? "¡Agregado!" : "Agregar"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug mb-1.5">
            {product.name}
          </p>
          {product.category && (
            <span className="text-xs text-gray-400 block mb-1.5">
              {product.category.name}
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            {product.show_price ? (
              <>
                <span
                  className="font-display font-black text-lg"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(product.price, currency)}
                </span>
                {product.compare_at_price &&
                  product.compare_at_price > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.compare_at_price, currency)}
                    </span>
                  )}
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-500 italic">
                Consultar precio
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
