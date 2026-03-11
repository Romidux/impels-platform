"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  MessageCircle,
  ArrowLeft,
  Minus,
  Plus,
  Package,
  Check,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Product, StoreSettings, ProductOptionType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import ProductCard from "./ProductCard";

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
  const addItem = useCartStore((s) => s.addItem);
  const primaryColor = settings?.primary_color || "#2563eb";
  const currency = settings?.currency || "Gs";

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [added, setAdded] = useState(false);

  const images = product.images?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const isOutOfStock = product.stock_status === "out_of_stock";
  const optionTypes = (product.option_types || []) as ProductOptionType[];

  // Find matching variant
  const selectedVariant =
    optionTypes.length > 0
      ? product.variant_combinations?.find((vc) => {
          const selectedValueIds = Object.values(selectedOptions);
          return (
            selectedValueIds.length === optionTypes.length &&
            selectedValueIds.every((vid) => vc.option_values.includes(vid))
          );
        })
      : undefined;

  const price = selectedVariant?.price ?? product.price;

  const variantLabel = optionTypes
    .map((ot) => {
      const selectedValId = selectedOptions[ot.id];
      const val = ot.values?.find((v) => v.id === selectedValId);
      return val ? `${ot.name}: ${val.value}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (optionTypes.length > 0) {
      const allSelected = optionTypes.every((ot) => selectedOptions[ot.id]);
      if (!allSelected) {
        toast.error("Selecciona todas las variantes");
        return;
      }
    }

    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: images[0]?.url,
      product_slug: product.slug,
      variant_combination_id: selectedVariant?.id,
      variant_label: variantLabel || undefined,
      price,
      quantity,
    });

    setAdded(true);
    toast.success("Agregado al carrito ✓");
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
                  {formatCurrency(price, currency)}
                </span>
                {product.compare_at_price &&
                  product.compare_at_price > price && (
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
              isOutOfStock
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Sin stock actualmente
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Disponible
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
                    onClick={() =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [ot.id]: val.id,
                      }))
                    }
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
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xl font-bold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] shadow-md ${
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : added
                    ? "bg-green-500"
                    : ""
              }`}
              style={
                !isOutOfStock && !added ? { backgroundColor: primaryColor } : {}
              }
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  ¡Agregado al carrito!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {isOutOfStock ? "No disponible" : "Agregar al carrito"}
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
        <div>
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
