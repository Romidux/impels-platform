"use client";

import { useState } from "react";
import Image from "next/image";
import { Product, StoreSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { ShoppingBag, ChevronRight, Share, Heart, Plus, Minus } from "lucide-react";
import ProductGrid from "./ProductGrid";
import { useProductDetailLogic } from "@/lib/hooks/useProductDetailLogic";

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
  const { items: cartItems, addItem } = useCartStore();
  const currency = settings?.currency || "Gs";

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const [activeImage, setActiveImage] = useState(primaryImage?.url || "");

  const {
    quantity,
    selectedOptions,
    selectedVariant,
    currentPrice,
    availableStock,
    isOutOfStock,
    buttonState,
    variantLabel,
    handleOptionChange,
    incrementQuantity,
    decrementQuantity,
    optionTypes,
    inCartQuantity
  } = useProductDetailLogic({ product, cartItems });

  const handleAddToCart = () => {
    if (buttonState.disabled) {
      if (buttonState.type === "selection_pending") {
        toast.error("Por favor, selecciona una opción");
      }
      return;
    }
    
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_combination_id: selectedVariant?.id,
      variant_label: variantLabel || undefined,
      price: currentPrice,
      quantity: quantity,
      product_image: activeImage,
    });
    
    if (inCartQuantity > 0) {
      toast.success("Cantidad actualizada en tu carrito");
    } else {
      toast.success("Producto agregado al carrito");
    }
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
            
            <div className="aspect-square bg-gray-100 flex-1 relative overflow-hidden group">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name || "Producto"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center border-none shadow-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  Sin imagen
                </div>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col justify-start max-w-[420px] pt-0 lg:pt-10">
            {product.category?.name && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 block">
                {product.category.name}
              </span>
            )}
            
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <p className="text-xl text-gray-900 mb-8 border-b border-gray-100 pb-8">
              {formatCurrency(currentPrice, currency)}
            </p>

            {product.description && (
              <div className="text-sm text-gray-600 space-y-4 mb-10 leading-relaxed font-light whitespace-pre-line">
                {product.description}
              </div>
            )}

            {/* Options */}
            {product.has_variants && optionTypes.length > 0 && (
              <div className="mb-10 space-y-7">
                {optionTypes.map((ot) => (
                  <div key={ot.id} className="space-y-3">
                    <span className="text-sm font-medium text-gray-900 block">
                      {ot.name}
                      {selectedOptions[ot.id] && (
                        <span className="font-normal text-gray-500 ml-2">
                          ({ot.values?.find((v) => v.id === selectedOptions[ot.id])?.value})
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ot.values?.map((val) => (
                        <button
                          key={val.id}
                          onClick={() => handleOptionChange(ot.id, val.id)}
                          className={`px-5 py-3 text-sm tracking-wide border transition-all ${
                            selectedOptions[ot.id] === val.id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 text-gray-900 hover:border-gray-400"
                          }`}
                        >
                          {val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4">
              {/* Row 1: Quantity & Add to cart */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 h-[52px] px-2">
                  <button 
                    onClick={decrementQuantity}
                    className="p-2 text-gray-500 hover:text-black transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button 
                    onClick={incrementQuantity}
                    className="p-2 text-gray-500 hover:text-black transition-colors"
                    disabled={buttonState.disabled}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={buttonState.disabled}
                  className={`flex-1 bg-black text-white h-[52px] text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors ${
                    buttonState.disabled ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {buttonState.text}
                </button>
              </div>

              {/* Row 2: WhatsApp */}
              {settings?.whatsapp_number && (
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hola! Me interesa el producto: ${product.name}${variantLabel ? ` (${variantLabel})` : ""}. ¿Está disponible?`);
                    window.open(`https://wa.me/${settings.whatsapp_number}?text=${message}`, "_blank");
                  }}
                  className="w-full border border-gray-200 text-gray-900 h-[52px] text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  Pedir por WhatsApp
                </button>
              )}

              {/* Row 3: Save & Share */}
              <div className="flex items-center justify-between w-full mt-2">
                <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
                  <Heart className="w-4 h-4" /> Guardar
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Enlace copiado al portapapeles");
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
                >
                  <Share className="w-4 h-4" /> Compartir
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
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
            imageRatio={settings?.product_image_ratio}
          />
        </div>
      )}
    </div>
  );
}
