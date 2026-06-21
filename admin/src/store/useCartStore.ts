import { create } from 'zustand';
import { Product, ProductExtra } from '@piacere/contracts';

export interface CartItem {
  id: string; // unique key: product-extras
  productId: number;
  name: string;
  extras: ProductExtra[];
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

  addItem: (product: Product, extras?: ProductExtra[]) => void;
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

  addItem: (product, extras = []) => {
    // Generate an ID based on product and sorted extra IDs to group identical configurations
    const extraIdsStr = extras.length > 0 ? '-' + extras.map(e => e.id).sort().join(',') : '';
    const id = `${product.id}${extraIdsStr}`;
    const extrasPrice = extras.reduce((sum, e) => sum + e.price, 0);
    const price = product.basePrice + extrasPrice;

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
            name: product.name,
            extras,
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

  clearCart: () => set({ items: [], tableId: null, orderType: 'dine_in', discount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  total: () => {
    const sub = get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return Math.max(0, sub - get().discount);
  },
}));
