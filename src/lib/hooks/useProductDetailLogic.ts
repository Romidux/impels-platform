"use client";

import { useState, useMemo, useEffect } from "react";
import { Product, ProductVariantCombination, CartItem, ProductOptionType } from "@/lib/types";
import { toast } from "sonner";

interface UseProductDetailLogicProps {
  product: Product;
  cartItems: CartItem[];
}

export function useProductDetailLogic({ product, cartItems }: UseProductDetailLogicProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const optionTypes = (product.option_types || []) as ProductOptionType[];
  const hasVariants = product.has_variants && optionTypes.length > 0;

  // 1. Detect selected variant
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return undefined;
    
    const selectedValueIds = Object.values(selectedOptions);
    if (selectedValueIds.length !== optionTypes.length) return undefined;

    return product.variant_combinations?.find((vc) =>
      selectedValueIds.every((vid) => vc.option_values.includes(vid))
    );
  }, [hasVariants, selectedOptions, product.variant_combinations, optionTypes.length]);

  // 2. Reset quantity on variant change
  useEffect(() => {
    setQuantity(1);
  }, [selectedOptions]);

  // 3. Calculate Stock & Availability
  const { maxStock, inCartQuantity, availableStock, isOutOfStock } = useMemo(() => {
    let baseStock = 0;
    
    if (product.manage_stock_by_variant) {
      baseStock = selectedVariant?.stock ?? 0;
    } else {
      baseStock = product.stock_quantity ?? 0;
    }

    // Find what's already in cart for this specific item (product or variant)
    const inCart = cartItems
      .filter(item => 
        item.product_id === product.id && 
        item.variant_combination_id === selectedVariant?.id
      )
      .reduce((acc, item) => acc + item.quantity, 0);

    const available = Math.max(0, baseStock - inCart);
    
    // If we have variants but none is fully selected, we don't show "Out of stock" yet
    const needsSelection = hasVariants && !selectedVariant;
    const outOfStock = !needsSelection && available <= 0 && !product.allow_backorder;

    return {
      maxStock: baseStock,
      inCartQuantity: inCart,
      availableStock: available,
      isOutOfStock: outOfStock
    };
  }, [product, selectedVariant, cartItems, hasVariants]);

  // 4. Price
  const currentPrice = selectedVariant?.price ?? product.price;

  // 5. Button & UI State
  const buttonState = useMemo(() => {
    if (hasVariants && !selectedVariant) {
      return { text: "Selecciona una opción", disabled: true, type: "selection_pending" };
    }
    if (isOutOfStock) {
      return { text: "Sin stock", disabled: true, type: "out_of_stock" };
    }
    return { text: "Agregar al carrito", disabled: false, type: "ready" };
  }, [hasVariants, selectedVariant, isOutOfStock]);

  // 6. Actions
  const handleOptionChange = (optionTypeId: string, valueId: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionTypeId]: valueId }));
  };

  const incrementQuantity = () => {
    if (!product.track_inventory || product.allow_backorder) {
      setQuantity(prev => prev + 1);
      return;
    }

    if (quantity >= availableStock) {
      if (inCartQuantity > 0) {
        toast.error(`Ya tienes ${inCartQuantity} en el carrito. No hay más stock disponible.`);
      } else {
        toast.error(`Solo hay ${maxStock} unidades disponibles`);
      }
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const variantLabel = useMemo(() => {
    return optionTypes
      .map((ot) => {
        const selectedValId = selectedOptions[ot.id];
        const val = ot.values?.find((v) => v.id === selectedValId);
        return val ? `${ot.name}: ${val.value}` : null;
      })
      .filter(Boolean)
      .join(", ");
  }, [optionTypes, selectedOptions]);

  return {
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
    hasVariants,
    inCartQuantity
  };
}
