import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  productNameAr?: string;
  variantNameAr?: string;
  price: number;
  image: string;
  quantity: number;
  /** set for bundles: the bundle and the option chosen for each of its items */
  bundleId?: string;
  selections?: Record<string, string>;
  /** optional gift box / wrapping (price is per unit and not discounted) */
  /** chosen packaging (one or more). packagingId is how older carts stored a single choice */
  packagingIds?: string[];
  packagingId?: string;
  /** names joined with ", " and the price per unit with each package's free rule applied */
  packagingName?: string;
  packagingNameAr?: string;
  packagingPrice?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  packagingTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const keyOf = (i: { productId: string; variantId: string; packagingIds?: string[]; packagingId?: string }) => {
            const ids = [...(i.packagingIds ?? (i.packagingId ? [i.packagingId] : []))].sort();
            return `${i.productId}-${i.variantId}${ids.length ? `-${ids.join("+")}` : ""}`;
          };
          const key = keyOf(item);
          const existing = state.items.find((i) => keyOf(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                keyOf(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, id: key }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        })),

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      packagingTotal: () => get().items.reduce((sum, i) => sum + (i.packagingPrice || 0) * i.quantity, 0),
    }),
    { name: "urpiece-cart" }
  )
);
