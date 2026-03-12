"use client";

import { useState } from "react";
import { Product, StoreSettings, ProductVariantCombination } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { ShoppingBag, ChevronRight, Share, Heart } from "lucide-react";
import ProductGrid from "./ProductGrid";

interface MinimalProductDetailProps {
  product: Product;
  storeSlug: string;
  settings?: StoreSettings;
  relatedProducts: Product[];
}

export default function MinimalProductDetailClient({
  product,
  storeSlug,
  settings,
  relatedProducts,
}: MinimalProductDetailProps) {
  const addItem = useCartStore((s) => s.addItem);
  const currency = settings?.currency || "Gs";

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const [activeImage, setActiveImage] = useState(primaryImage?.url || "");

  // Variant selection setup
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantCombination | null>(
    product.variant_combinations?.[0] || null
  );

  const price = selectedVariant?.price ?? product.price ?? 0;

  const handleAddToCart = () => {
    if (product.has_variants && !selectedVariant) {
      toast.error("Por favor selecciona una variante");
      return;
    }
    
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_combination_id: selectedVariant?.id,
      variant_label: selectedVariant?.sku,
      price: price,
      quantity: 1,
      product_image: activeImage,
    });
    
    toast.success("Producto agregado al carrito");
  };

  return (
    <div className="w-full bg-white pb-24">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 text-sm text-gray-500 flex items-center gap-2">
        <a href={`/store/${storeSlug}`} className="hover:text-black transition-colors">Inicio</a>
        <ChevronRight className="w-3 h-3" />
        <a href={`/store/${storeSlug}/catalog`} className="hover:text-black transition-colors">Catálogo</a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 truncate">
          {product.name}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-24">
          
          {/* Images Section */}
          <div className="flex flex-col-reverse md:flex-row gap-4 h-fit">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible flex-shrink-0 md:w-20 no-scrollbar">
              {product.images?.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative w-20 h-24 flex-shrink-0 bg-gray-100 overflow-hidden border ${
                    activeImage === img.url ? "border-black" : "border-transparent"
                  } transition-colors`}
                >
                  <img src={img.url} className="w-full h-full object-cover object-center" alt="" />
                </button>
              ))}
            </div>
            
            <div className="aspect-[4/5] bg-gray-100 flex-1 relative overflow-hidden group">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  Sin imagen
                </div>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col justify-start max-w-md pt-0 lg:pt-10">
            {product.category?.name && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 block">
                {product.category.name}
              </span>
            )}
            
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <p className="text-xl text-gray-900 mb-8 border-b border-gray-100 pb-8">
              {formatCurrency(price, currency)}
            </p>

            {product.description && (
              <div className="text-sm text-gray-600 space-y-4 mb-10 leading-relaxed font-light whitespace-pre-line">
                {product.description}
              </div>
            )}

            {/* Options */}
            {product.has_variants && product.variant_combinations && product.variant_combinations.length > 0 && (
              <div className="mb-10 space-y-5">
                <span className="text-sm font-medium text-gray-900 block">Variantes</span>
                <div className="flex flex-wrap gap-2">
                  {product.variant_combinations.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-5 py-3 text-sm tracking-wide border transition-all ${
                        selectedVariant?.id === variant.id
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-900 hover:border-gray-400"
                      } ${
                        variant.stock === 0 ? "opacity-30 cursor-not-allowed border-gray-100" : ""
                      }`}
                    >
                      {variant.sku || `Opción ${variant.price}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white px-8 py-4 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Agregar a la bolsa
              </button>
              <button className="p-4 border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Envío estándar y devoluciones 30 días</span>
              <button className="flex items-center gap-2 hover:text-black transition-colors">
                <Share className="w-4 h-4" /> Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-16">
          <ProductGrid
            title="También podría gustarte"
            products={relatedProducts}
            storeSlug={storeSlug}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
