import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, ProductExtra } from '@piacere/contracts'

export interface WebCartItem {
  id: string
  productId: number
  name: string
  extras: ProductExtra[]
  quantity: number
  unitPrice: number
}

interface WebCartState {
  items: WebCartItem[]
  isOpen: boolean
  setOpen: (v: boolean) => void
  addItem: (product: Product, extras?: ProductExtra[]) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useWebCartStore = create<WebCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setOpen: (isOpen) => set({ isOpen }),
      addItem: (product, extras = []) => {
        const extraIdsStr = extras.length > 0 ? '-' + extras.map(e => e.id).sort().join(',') : ''
        const id = `${product.id}${extraIdsStr}`
        const extrasPrice = extras.reduce((sum, e) => sum + e.price, 0)
        const price = product.basePrice + extrasPrice

        set((state) => {
          const existing = state.items.find(i => i.id === id)
          if (existing) {
            return { items: state.items.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i), isOpen: true }
          }
          return { items: [...state.items, { id, productId: product.id, name: product.name, extras, quantity: 1, unitPrice: price }], isOpen: true }
        })
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, qty) => set(s => ({
        items: qty <= 0 ? s.items.filter(i => i.id !== id) : s.items.map(i => i.id === id ? { ...i, quantity: qty } : i)
      })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'piacere-web-cart' }
  )
)
