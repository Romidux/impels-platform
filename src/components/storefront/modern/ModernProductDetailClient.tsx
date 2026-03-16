"use client";

import { useState } from "react";
import Link from "next/link";
import { useProductDetailLogic } from "@/lib/hooks/useProductDetailLogic";
import {
  ShoppingCart,
  MessageCircle,
  ArrowLeft,
  Minus,
  Plus,
  Package,
  Check,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Product, StoreSettings, ProductOptionType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import ProductCard from "../shared/ProductCard";

interface ProductDetailClientProps {
  product: Product;
  storeSlug: string;
  settings?: StoreSettings;
  relatedProducts: Product[];
  whatsappNumber?: string;
}

export default function ProductDetailClient({
  product,
  storeSlug,
  settings,
  relatedProducts,
  whatsappNumber,
}: ProductDetailClientProps) {
  const { items: cartItems, addItem } = useCartStore();
  const primaryColor = settings?.primary_color || "#2563eb";
  const currency = settings?.currency || "Gs";

  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  const images = product.images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  
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
      product_image: images[0]?.url,
      product_slug: product.slug,
      variant_combination_id: selectedVariant?.id,
      variant_label: variantLabel || undefined,
      price: currentPrice,
      quantity,
    });

    setAdded(true);
    if (inCartQuantity > 0) {
      toast.success("Cantidad actualizada en tu carrito");
    } else {
      toast.success("Producto agregado al carrito");
    }
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWhatsAppDirect = () => {
    if (!whatsappNumber) {
      toast.error("Tienda sin WhatsApp configurado");
      return;
    }
    const message = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.name}${variantLabel ? ` (${variantLabel})` : ""}. ¿Está disponible?`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link
          href={`/store/${storeSlug}`}
          className="hover:text-gray-600 transition-colors"
        >
          Inicio
        </Link>
        <span>/</span>
        <Link
          href={`/store/${storeSlug}/catalog`}
          className="hover:text-gray-600 transition-colors"
        >
          Catálogo
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/store/${storeSlug}/catalog?category=${product.category.id}`}
              className="hover:text-gray-600 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700 truncate max-w-[200px]">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-300" />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? "border-blue-500 shadow-glow"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {product.category && (
            <Link
              href={`/store/${storeSlug}/catalog?category=${product.category.id}`}
              className="text-sm font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {product.show_price ? (
              <>
                <span
                  className="font-display text-4xl font-black"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(currentPrice, currency)}
                </span>
                {product.compare_at_price &&
                  product.compare_at_price > currentPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrency(product.compare_at_price, currency)}
                    </span>
                  )}
              </>
            ) : (
              <span className="text-2xl text-gray-500 italic font-semibold">
                Consultar precio
              </span>
            )}
          </div>

          {/* Stock status */}
          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full ${
              buttonState.type === "selection_pending"
                ? "bg-blue-50 text-blue-700"
                : isOutOfStock
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {buttonState.type === "selection_pending" ? (
              <>
                <Tag className="w-4 h-4" />
                Selecciona una variante para ver disponibilidad
              </>
            ) : isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Sin stock actualmente
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {product.track_inventory
                  ? `Disponible (${availableStock} unids.)`
                  : product.allow_backorder && availableStock <= 0
                    ? "Disponible (Bajo pedido)"
                    : "Disponible"}
                {inCartQuantity > 0 && <span className="opacity-60 ml-1">({inCartQuantity} en carrito)</span>}
              </>
            )}
          </div>

          {/* Variant selectors */}
          {optionTypes.map((ot) => (
            <div key={ot.id} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {ot.name}
                {selectedOptions[ot.id] && (
                  <span className="font-normal text-gray-500 ml-2">
                    ({ot.values?.find((v) => v.id === selectedOptions[ot.id])?.value})
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {ot.values?.map((val) => (
                  <button
                    key={val.id}
                    onClick={() => handleOptionChange(ot.id, val.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all ${
                      selectedOptions[ot.id] === val.id
                        ? "border-transparent text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    style={
                      selectedOptions[ot.id] === val.id
                        ? { backgroundColor: primaryColor, borderColor: primaryColor }
                        : {}
                    }
                  >
                    {val.value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Cantidad
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuantity}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xl font-bold">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                disabled={buttonState.disabled}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={buttonState.disabled}
              className={`flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] shadow-md ${
                buttonState.disabled
                  ? "bg-gray-400 cursor-not-allowed hover:scale-100"
                  : added
                    ? "bg-green-500"
                    : ""
              }`}
              style={
                !buttonState.disabled && !added ? { backgroundColor: primaryColor } : {}
              }
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  {inCartQuantity > quantity ? "¡Cantidad actualizada!" : "¡Agregado al carrito!"}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {buttonState.text}
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppDirect}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5" />
              Consultar por WhatsApp
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-gray-100">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                storeSlug={storeSlug}
                primaryColor={primaryColor}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
