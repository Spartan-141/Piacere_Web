// ============================================================
// Tipos de Mesas
// ============================================================

export type TableStatus = 'free' | 'waiting_order' | 'served' | 'reserved';

export interface TableSection {
  id: number;
  name: string;
  prefix: string;
  isActive: boolean;
}

export interface Table {
  id: number;
  name: string;
  capacity: number | null;
  sectionId: number | null;
  sectionName?: string | null;
  status: TableStatus;
  currentOrderId?: number | null;
}
