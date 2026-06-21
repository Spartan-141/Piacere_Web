// ============================================================
// Tipos de Pedidos Unificados
// ============================================================

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'phone';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderSource = 'pos' | 'web' | 'phone';
export type PaymentMethod = 'cash_usd' | 'cash_ves' | 'card' | 'transfer' | 'pago_movil' | 'online';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName?: string;
  extras?: { id: number; name: string; price: number }[];
  comboId: number | null;
  comboName?: string | null;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

export interface Payment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  paidAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  source: OrderSource;
  tableId: number | null;
  tableName?: string | null;
  customerId: number | null;
  customerName?: string | null;
  deliveryAddressId: number | null;
  deliveryAddress?: string | null;
  deliveryNotes: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdBy: number | null;
  tip?: number;
  items?: OrderItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemInput {
  productId?: number;
  extraIds?: number[];
  comboId?: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateOrderInput {
  type: OrderType;
  source?: OrderSource;
  tableId?: number;
  customerId?: number;
  deliveryAddressId?: number;
  deliveryNotes?: string;
  items: CreateOrderItemInput[];
  discount?: number;
  tip?: number;
}
