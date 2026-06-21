# 🍕 Piacere 2.0 — Management Ecosystem

Bienvenido al ecosistema integral de gestión para **Piacere**. Este proyecto es un monorepo basado en **pnpm** y **Turborepo** que organiza las aplicaciones principales del sistema en carpetas independientes, manteniendo contratos compartidos para evitar duplicación de tipos y DTOs.

---

## 🏗️ Arquitectura del Sistema

El proyecto está separado por aplicaciones:

- **`backend/`**: API Node.js con Express y SQLite (`better-sqlite3`). Maneja autenticación, menú, pedidos, mesas y clientes.
- **`admin/`**: Panel administrativo y POS construido con React 18 + Vite + Tailwind CSS.
- **`web/`**: Landing page y catálogo comercial para clientes finales.
- **`packages/contracts/`**: Paquete interno que centraliza tipos, DTOs y contratos compartidos entre backend, admin y web.

Estructura principal:

```txt
piacere/
├─ backend/
├─ admin/
├─ web/
├─ packages/
│  └─ contracts/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

Esta separación permite ejecutar y desplegar cada aplicación de forma independiente, pero mantiene una fuente única de verdad para los tipos compartidos.

---

## 🚀 Cómo Iniciar el Sistema

### 1. Requisitos Previos

- **Node.js**: v18 o superior.
- **pnpm**: `npm install -g pnpm`.

### 2. Instalación de Dependencias

Desde la raíz del proyecto, ejecuta:

```bash
pnpm install
```

### 3. Configuración de Base de Datos

Copia los archivos de ejemplo:

```bash
copy backend\.env.example backend\.env
copy admin\.env.example admin\.env
copy web\.env.example web\.env
```

Luego pobla la base de datos con el menú, mesas, categorías y usuarios administrativos iniciales:

```bash
pnpm db:seed
```

También puedes ejecutar el seed directamente desde el backend:

```bash
cd backend
pnpm db:seed
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

Puedes ejecutar cada aplicación por separado:

```bash
pnpm dev:backend
pnpm dev:admin
pnpm dev:web
```

---

## 🔑 Credenciales de Acceso (Modo Pruebas)

| Rol               | Correo               | Contraseña   |
| :---------------- | :------------------- | :----------- |
| **Administrador** | `admin@piacere.com`  | `admin123`   |
| **Cajero**        | `cajero@piacere.com` | `cajero123`  |
| **Cliente Web**   | `maria@example.com`  | `cliente123` |

---

## 🧰 Scripts Principales

Desde la raíz:

```bash
pnpm dev
pnpm build
pnpm lint

pnpm dev:backend
pnpm dev:admin
pnpm dev:web

pnpm build:backend
pnpm build:admin
pnpm build:web

pnpm db:seed
```

---

## 🍕 Módulos Implementados

### 1. Punto de Venta (POS)

- Catálogo táctil con productos y adicionales.
- Carrito de compras persistente.
- Soporte para métodos: Efectivo Bs., Efectivo $, Pago Móvil y Transferencia.

### 2. Gestión de Mesas

- Mapa visual del salón por zonas.
- Autogeneración de nombres de mesa.
- Estados de mesa: libre, esperando orden, servida y reservada.
- Acceso directo al POS desde la mesa.

### 3. CMS y E-commerce

- Control de visibilidad de productos en la web desde el panel admin.
- Landing page moderna con carrito interactivo para clientes.

---

## 🛠️ Tecnologías Principales

- **Backend**: Express, SQLite, Zod, JWT, bcrypt.
- **Frontend**: React 18, React Query v5, Zustand, Lucide Icons, Tailwind CSS.
- **DevOps**: Turborepo, pnpm workspaces, TypeScript 5.

---

## 🔮 Roadmap de Refactorización

La separación actual deja listo el proyecto para los siguientes pasos:

1. Separar backend en servicios, repositorios y DTOs.
2. Consolidar contratos compartidos en `packages/contracts`.
3. Refactorizar admin por features.
4. Refactorizar web por features.
5. Migrar backend a NestJS cuando la arquitectura interna esté estable.

---

© 2026 Piacere 2.0 - Sistema de Gestión de Restaurantes.
