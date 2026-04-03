// ============================================================
// Tipos de Productos, Variantes, Combos y Categorías
// ============================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  isVisibleOnWeb: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;       // "Personal", "Mediana", "Familiar"
  priceDelta: number; // Diferencia respecto al precio base
  isActive: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  isOnWebMenu: boolean;
  imageUrl: string | null;
  variants?: ProductVariant[];
  createdAt: string;
}

export interface ComboItem {
  id: number;
  comboId: number;
  productId: number;
  productName?: string;
  variantId: number | null;
  variantName?: string | null;
  quantity: number;
}

export interface Combo {
  id: number;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  isOnWebMenu: boolean;
  validFrom: string | null;
  validUntil: string | null;
  items?: ComboItem[];
}
