// ============================================================
// Tipos de Usuarios y Autenticación
// ============================================================

export type UserRole = 'customer' | 'waiter' | 'cashier' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface CustomerAddress {
  id: number;
  userId: number;
  label: string | null;
  address: string;
  city: string | null;
  isDefault: boolean;
}

export interface AuthTokenPayload {
  userId: number;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
