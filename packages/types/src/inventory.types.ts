// ============================================================
// Tipos de Inventario y Escandallo
// ============================================================

export type MovementType = 'purchase' | 'manual_adjustment' | 'sale_deduction' | 'waste';

export interface RawMaterial {
  id: number;
  name: string;
  unit: string;       // "kg", "litro", "unidad", "gramo"
  stockQuantity: number;
  minStockAlert: number;
  costPerUnit: number | null;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  unit?: string;
  quantity: number;
}

export interface Recipe {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName?: string;
  variantName?: string | null;
  ingredients?: RecipeIngredient[];
}

export interface InventoryMovement {
  id: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  type: MovementType;
  quantityDelta: number;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}
