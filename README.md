# 🍕 Piacere 2.0 — Management Ecosystem

Bienvenido al ecosistema integral de gestión para **Piacere**. Este proyecto es un monorepo robusto diseñado para manejar todas las operaciones de un restaurante/pizzería moderno, desde el Punto de Venta (POS) y la gestión de inventario hasta una landing page comercial con e-commerce integrado.

---

## 🏗️ Arquitectura del Sistema

El proyecto utiliza un enfoque de **Monorepo** basado en **pnpm** y **Turborepo** para una orquestación eficiente.

- **`apps/backend`**: Servidor Node.js con Express y SQLite (`better-sqlite3`). Maneja la lógica de negocio, autenticación, pedidos e inventario real.
- **`apps/admin`**: Panel administrativo y POS construido con React 18 + Vite + Tailwind CSS. Diseñado con una estética _Glassmorphism_ oscura.
- **`apps/web`**: Landing page y catálogo comercial para clientes finales.
- **`packages/types`**: Paquete interno que centraliza los tipos de TypeScript compartidos entre todas las aplicaciones, garantizando consistencia absoluta en los DTOs.

---

## 🚀 Cómo Iniciar el Sistema

Sigue estos pasos para levantar el entorno de desarrollo completo.

### 1. Requisitos Previos

- **Node.js**: v18 o superior.
- **pnpm**: `npm install -g pnpm`.

### 2. Instalación de Dependencias

Desde la raíz del proyecto, ejecuta:

```bash
pnpm install
```

### 3. Configuración de Base de Datos (Semilla)

Debes poblar la base de datos con el menú, mesas, categorías y usuarios administrativos iniciales:

```bash
cd apps/backend
npx ts-node src/database/seed.ts
```

### 4. Lanzar el Entorno de Desarrollo

Desde la raíz del monorepo, levanta todos los servicios simultáneamente:

```bash
pnpm dev
```

Esto iniciará los siguientes servicios:

- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Admin POS**: [http://localhost:5173](http://localhost:5173)
- **Web Cliente**: [http://localhost:5174](http://localhost:5174)

---

## 🔑 Credenciales de Acceso (Modo Pruebas)

| Rol               | Correo               | Contraseña   |
| :---------------- | :------------------- | :----------- |
| **Administrador** | `admin@piacere.com`  | `admin123`   |
| **Cajero**        | `cajero@piacere.com` | `cajero123`  |
| **Cliente Web**   | `maria@example.com`  | `cliente123` |

---

## 🍕 Módulos Implementados

### 1. Punto de Venta (POS)

- Catalogo táctil con variantes de productos.
- Carrito de compras persistente.
- Pagos multi-moneda (USD y VES) con soporte de tasa de cambio.
- Soporte para métodos: Efectivo Bs., Efectivo $, Pago Móvil y Transferencia.

### 2. Gestión de Mesas (Avanzado)

- Mapa visual del salón por **Zonas** (Terraza, Principal, Barra).
- Autogeneración de nombres de mesa (P1, T2, etc.).
- **Estados de color**:
  - 🟢 **Verde**: Libre.
  - 🔴 **Rojo (Animado)**: Esperando orden (Alerta de prioridad).
  - 🔵 **Azul**: Orden entregada / Mesa servida.
  - 🟡 **Amarillo**: Mesa Reservada.
- Acceso directo al POS desde la mesa.

### 3. Inventario y Escandallo

- Descuento automático de materia prima (harina, queso, etc.) al completar pedidos de cocina.
- Alertas de stock bajo en tiempo real.
- Historial de movimientos de inventario.

### 4. CMS y E-commerce

- Control de visibilidad de productos en la web desde el panel admin.
- Landing page moderna con carrito interactivo para clientes.

---

## 🛠️ Tecnologías Principales

- **Backend**: Express, SQLite (WAL Mode), Zod (Validación), JWT (Seguridad), bcrypt (Cifrado).
- **Frontend**: React 18, React Query v5 (Caching), Zustand (Estado), Lucide Icons, Tailwind CSS.
- **DevOps**: Turborepo, pnpm workspaces, TypeScript 5.

---

© 2026 Piacere 2.0 - Sistema de Gestión de Restaurantes.
