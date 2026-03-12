"use client";

import { useState } from "react";
import { Product, StoreSettings, ProductVariantCombination, ProductOptionType } from "@/lib/types";
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
  const optionTypes = (product.option_types || []) as ProductOptionType[];
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const selectedVariant = optionTypes.length > 0
    ? product.variant_combinations?.find((vc) => {
        const selectedValueIds = Object.values(selectedOptions);
        return (
          selectedValueIds.length === optionTypes.length &&
          selectedValueIds.every((vid) => vc.option_values.includes(vid))
        );
      })
    : undefined;

  const price = selectedVariant?.price ?? product.price ?? 0;

  // Stock logic
  let currentStock = product.stock_quantity || 0;
  let isOutOfStock = product.stock_status === "out_of_stock";

  if (product.track_inventory) {
    if (product.has_variants && product.manage_stock_by_variant) {
      if (selectedVariant) {
        currentStock = selectedVariant.stock || 0;
        isOutOfStock = currentStock <= 0 && !product.allow_backorder;
      } else {
        isOutOfStock = true;
      }
    } else {
      currentStock = product.stock_quantity || 0;
      isOutOfStock = currentStock <= 0 && !product.allow_backorder;
    }
  }

  const variantLabel = optionTypes
    .map((ot) => {
      const selectedValId = selectedOptions[ot.id];
      const val = ot.values?.find((v) => v.id === selectedValId);
      return val ? `${ot.name}: ${val.value}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const handleAddToCart = () => {
    if (isOutOfStock && !product.allow_backorder) return;
    
    if (product.has_variants) {
      const allSelected = optionTypes.every((ot) => selectedOptions[ot.id]);
      if (!allSelected) {
        toast.error("Por favor selecciona todas las variantes");
        return;
      }
      if (!selectedVariant) {
        toast.error("Variante no disponible");
        return;
      }
    }
    
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      variant_combination_id: selectedVariant?.id,
      variant_label: variantLabel || undefined,
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
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [ot.id]: val.id }))}
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
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock && !product.allow_backorder}
                className={`flex-1 bg-black text-white px-8 py-4 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors ${
                  isOutOfStock && !product.allow_backorder ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : ""
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock && !product.allow_backorder ? "Agotado" : "Agregar a la bolsa"}
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
