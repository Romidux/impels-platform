import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./types";

interface CartStore {
  items: CartItem[];
  storeSlug: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => void;
  clearCart: () => void;
  setStore: (slug: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      setStore: (slug: string) => {
        const currentSlug = get().storeSlug;
        if (currentSlug && currentSlug !== slug) {
          set({ items: [], storeSlug: slug });
        } else {
          set({ storeSlug: slug });
        }
      },

      addItem: (item: CartItem) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) =>
            i.product_id === item.product_id &&
            i.variant_combination_id === item.variant_combination_id
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
          };
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId: string, variantId?: string) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.product_id === productId &&
                item.variant_combination_id === variantId
              )
          ),
        });
      },

      updateQuantity: (
        productId: string,
        quantity: number,
        variantId?: string
      ) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product_id === productId &&
            item.variant_combination_id === variantId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "impels-cart",
    }
  )
);
