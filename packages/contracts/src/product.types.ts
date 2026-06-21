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

export interface ProductExtra {
  id: number;
  name: string;
  price: number;
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

  createdAt: string;
}

export interface ComboItem {
  id: number;
  comboId: number;
  productId: number;
  productName?: string;

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
