import { create } from 'zustand';
import { Product, ProductVariant } from '@piacere/types';

export interface CartItem {
  id: string; // unique key: product-variant or product
  productId: number;
  variantId: number | null;
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface CartState {
  items: CartItem[];
  tableId: number | null;
  orderType: 'dine_in' | 'takeaway' | 'phone';
  discount: number;

  setTable: (tableId: number | null) => void;
  setOrderType: (type: 'dine_in' | 'takeaway' | 'phone') => void;
  setDiscount: (amount: number) => void;

  addItem: (product: Product, variant: ProductVariant | null) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;

  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  orderType: 'dine_in',
  discount: 0,

  setTable: (tableId) => set({ tableId }),
  setOrderType: (orderType) => set({ orderType }),
  setDiscount: (discount) => set({ discount }),

  addItem: (product, variant) => {
    const id = `${product.id}-${variant?.id ?? 'base'}`;
    const price = product.basePrice + (variant?.priceDelta ?? 0);

    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id,
            productId: product.id,
            variantId: variant?.id ?? null,
            name: product.name,
            variantName: variant?.name ?? null,
            quantity: 1,
            unitPrice: price,
            notes: '',
          },
        ],
      };
    });
  },

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => i.id !== id)
        : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),

  updateNotes: (id, notes) =>
    set((state) => ({ items: state.items.map((i) => (i.id === id ? { ...i, notes } : i)) })),

  clearCart: () => set({ items: [], tableId: null, discount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  total: () => {
    const sub = get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return Math.max(0, sub - get().discount);
  },
}));
