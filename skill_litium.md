# Skill: Estructura Fullstack Litium

Esta skill define la arquitectura y convenciones del proyecto Litium para replicarla en otros proyectos.

## Stack Tecnológico

### Backend
- **NestJS 10.x** — Framework modular Node.js
- **Prisma ORM 6.x** — Acceso a datos tipado
- **MySQL** — Base de datos relacional
- **Socket.io 4.x** — WebSockets en tiempo real
- **JWT** + **bcrypt** — Autenticación y autorización
- **class-validator / class-transformer** — Validación de DTOs
- **Swagger** — Documentación de API
- **TypeScript 5.x**

### Frontend
- **React 18.3** + **Vite 6** — SPA
- **Redux Toolkit 2.9** — Estado global
- **Tailwind CSS 4.1** — Estilos
- **Axios** — Cliente HTTP
- **Socket.io-client 4.8** — WebSockets cliente
- **React Router 6** — Rutas
- **HeroUI** — Componentes UI
- **TypeScript 5.6**

---

## Estructura de Carpetas del Proyecto

```
Litium/
├── backend/
│   ├── src/
│   │   ├── main.ts                    # Bootstrap NestJS, CORS, Swagger, pipes globales
│   │   ├── app.module.ts              # Módulo raíz, importa todos los módulos
│   │   ├── app.controller.ts
│   │   ├── config/
│   │   │   └── publicRoutes.ts        # Rutas permitidas sin autenticación JWT
│   │   ├── guards/
│   │   │   └── permission.guard.ts    # Guard de permisos por método HTTP
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # Verifica JWT en Authorization header
│   │   │   └── request.logger.middleware.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts     # Transform implícito + validación global
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts      # Servicio Prisma singleton
│   │   │   └── prisma.module.ts
│   │   ├── common/
│   │   │   ├── utils/
│   │   │   │   └── base.mapper.ts
│   │   │   ├── dto/
│   │   │   │   └── pagination.dto.ts
│   │   │   └── decorators/
│   │   │       └── permissions.decorator.ts  # @Permissions(perm.xxx)
│   │   ├── modules/                   # Módulos de dominio (cada uno independiente)
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── product/               # Patrón estándar por módulo:
│   │   │   │   ├── product.module.ts
│   │   │   │   ├── product.controller.ts
│   │   │   │   ├── product.service.ts
│   │   │   │   ├── mapper/
│   │   │   │   │   └── product.mapper.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── product.specificationBuilder.ts  # Querys dinámicas
│   │   │   │   └── dto/
│   │   │   │       ├── create-product.dto.ts
│   │   │   │       ├── product-filters.dto.ts
│   │   │   │       ├── product-response.dto.ts
│   │   │   │       └── product-page-response.dto.ts
│   │   │   ├── productCategory/
│   │   │   ├── productCatalog/
│   │   │   ├── productSupplier/
│   │   │   ├── productComment/
│   │   │   ├── productCommentReply/
│   │   │   ├── shoppingCart/
│   │   │   ├── invoice/
│   │   │   ├── role/
│   │   │   ├── user/
│   │   │   ├── file/
│   │   │   ├── messages/              # WebSocket gateway
│   │   │   │   ├── message.module.ts
│   │   │   │   ├── message.controller.ts
│   │   │   │   ├── message.gateway.ts  # @WebSocketGateway + @SubscribeMessage
│   │   │   │   └── message.service.ts
│   │   │   ├── dashboard/
│   │   │   └── report/
│   │   └── types/
│   │       ├── Page.ts                # Page<T> genérico para paginación
│   │       └── server.mode.ts         # Enum: DEV | PRODUCTION
│   ├── prisma/
│   │   ├── schema.prisma              # Schema de BD centralizado
│   │   └── seed.ts                    # Datos iniciales
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── test/
│       └── jest-e2e.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.ts                # Instancia axios con baseURL=VITE_SERVER_API
    │   │   └── socket.ts               # Socket.io-client contra VITE_SERVER_API
    │   ├── routes/
    │   │   ├── index.tsx              # Definición de rutas (react-router v6)
    │   │   └── middlewares/
    │   │       ├── ProtectedRouteAuth.tsx   # Redirige si ya está logueado
    │   │       └── ProtectedRouteSession.tsx # Redirige si NO está logueado
    │   ├── store/
    │   │   └── index.ts               # configureStore + combineReducers
    │   ├── features/                  # Redux slices globales
    │   │   ├── homeSlice.ts
    │   │   ├── userSlice.ts
    │   │   ├── shoppingCartSlice.ts
    │   │   ├── dashboardSlice.ts
    │   │   ├── appTableSlice.ts
    │   │   └── currentModalSlice.ts
    │   ├── types/                     # Modelos TypeScript compartidos
    │   │   ├── productModel.ts
    │   │   ├── userModel.ts
    │   │   ├── supplierModel.ts
    │   │   ├── shoppingCartModel.ts
    │   │   ├── categoryModel.ts
    │   │   ├── catalogModel.ts
    │   │   ├── productCommentModel.ts
    │   │   ├── checkoutModel.ts
    │   │   ├── invoiceModel.ts
    │   │   ├── dashboardModel.ts
    │   │   ├── paginatedResponse.ts
    │   │   ├── messageModal.ts
    │   │   └── index.ts
    │   ├── utils/                     # Helpers y formatters
    │   │   ├── formatCurrency.ts
    │   │   ├── buildFormData.ts
    │   │   ├── getFormattedDateTime.ts
    │   │   ├── logOut.ts
    │   │   ├── paramsConstructor.ts
    │   │   └── pluralize.ts
    │   ├── styles/
    │   │   └── globals.css
    │   ├── provider.tsx
    │   ├── modules/                   # Módulos por dominio (espejo del backend)
    │   │   ├── auth/
    │   │   │   ├── services/index.ts   # reqAuthLogin, reqAuthRegister
    │   │   │   ├── pages/Login.tsx
    │   │   │   └── pages/Register.tsx
    │   │   ├── product/
    │   │   │   ├── services/index.ts
    │   │   │   └── components/
    │   │   ├── catalog/
    │   │   ├── product/
    │   │   ├── checkout/
    │   │   ├── messages/
    │   │   │   ├── services/
    │   │   │   ├── slices/chatSlice.ts
    │   │   │   └── layout/
    │   │   ├── purchases/
    │   │   │   ├── services/index.ts
    │   │   │   ├── slices/purchaseSlice.ts
    │   │   │   └── components/
    │   │   ├── home/
    │   │   ├── 404/
    │   │   └── admin/
    │   │       ├── layout/
    │   │       └── pages/
    │   │           ├── dashboard.tsx
    │   │           ├── product.tsx
    │   │           ├── catalog.tsx
    │   │           ├── sales.tsx
    │   │           ├── supplier.tsx
    │   │           ├── category.tsx
    │   │           └── messages.tsx
    │   └── components/
    │       ├── ScrollTop.tsx
    │       └── CheckPermissionByComponent.tsx
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── tailwind.config.js
    └── vercel.json
```

---

## Convenciones y Patrones de Backend

### Módulo estándar
Todo módulo sigue esta estructura:
```
modulo/
├── modulo.module.ts      # Imports, exports, providers
├── modulo.controller.ts  # @Controller('ruta'), decoradores Swagger, @Permissions
├── modulo.service.ts     # Lógica de negocio
├── dto/                  # DTOs entrada/salida con class-validator
│   ├── create-x.dto.ts
│   ├── x-filters.dto.ts
│   ├── x-response.dto.ts
│   └── x-page-response.dto.ts
├── mapper/               # Prisma model → Response DTO
│   └── x.mapper.ts
└── repositories/         # Specification Builder para consultas dinámicas
    └── x.specificationBuilder.ts
```

### Cuándo circular dependencias
Usa `forwardRef(() => ModuloDependiente)` en el `imports` del módulo principal.

### Autenticación y Autorización
- **AuthMiddleware**: intercepta todas las rutas (excepto `publicRoutes.ts`), extrae y valida JWT, adjunta `req.user`.
- **PermissionGuard**: valida permisos del endpoint contra el JWT.
- **@Permissions(perm.xxx)**: decorador que marca qué permiso requiere el endpoint.
- Rutas públicas definidas en `src/config/publicRoutes.ts` con método y path regex.

### Paginación
Devuelve siempre objetos tipados como:
```ts
{
  content: T[],
  totalPages: number,
  totalItems: number,
  currentPage: number,
  rowsPerPage: number
}
```

### Uploads
- Imágenes guardadas en `./uploads` con nombre único `timestamp-random.ext`.
- Servidas estáticamente con `ServeStaticModule` (`/uploads`).
- Tipos permitidos: jpeg, png, webp, gif.

---

## Convenciones y Patrones de Frontend

### Comunicación HTTP
Instancia centralizada en `src/api/axios.ts`:
- `baseURL`: `import.meta.env.VITE_SERVER_API`
- Headers: `Authorization: Bearer <token>` desde `localStorage`
- `paramsSerializer`: usa `qs.stringify` para arrays y strings complejos

Ejemplo de servicio por módulo (`modules/product/services/index.ts`):
```ts
export const reqCreateComment = (data: ReqCreateComment) => api.post('/comment', data)
export const reqGetProductComments = (params: ReqGetCommentsParams) =>
  api.get(`/comment/`, { params })
```

### WebSockets
Instancia centralizada en `src/api/socket.ts`:
```ts
export const socket = io(import.meta.env.VITE_SERVER_API, { transports: ['websocket'] })
```
Emits: `joinCart`, `leaveCart`, `sendMessage`, `editMessage`, `deleteMessage`, `confirm`.  
Listens: `newMessage`, `messageEdited`, `messageDeleted`, `orderConfirmed`.

### Estado Global
- **Redux Toolkit** (`configureStore`) con `combineReducers`.
- Slices globales en `src/features/`.
- Slices locales de módulos en `src/modules/<modulo>/slices/`.

### Rutas
- Rutas públicas: `/login`, `/register` (protegidas por `ProtectedRouteAuth` — si ya hay sesión, redirige).
- Rutas privadas: todo protegido por `ProtectedRouteSession` — si no hay sesión, redirige a `/login`.
- Rutas admin: envueltas en `CheckPermissionByComponent permission={'*'} mode='remove'` + `AdminLayout`.
- Layouts diferenciados: `Layout` (público) y `AdminLayout`.

---

## Entorno y Variables

### Backend (`.env`)
```
PORT=3001
SECRET_KEY=tu_clave_jwt
SERVER_MODE=DEV | PRODUCTION
DATABASE_URL="mysql://root:pass@localhost:3306/litium"
```

### Frontend (`.env`)
```
VITE_SERVER_API="http://localhost:3001"
```

---

## Comandos Clave

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run start:dev   # Hot reload NestJS
npm run build       # Compila a dist/
npm run start:prod  # Migra + seed + sirve dist/

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev         # Vite dev server (5173)
npm run build       # TypeScript check + build
npm run preview     # Preview producción local
```

---

## Decisiones de Diseño para Replicar

1. **Backend y frontend separados** pero en el mismo monorepo.
2. **Un backend por puerto** (no serverless por archivo) para reutilizar socket.io.
3. **Contrato estricto**: DTOs en backend, tipos en frontend.
4. **Cada módulo de dominio es autocontenido** con sus DTOs, mapper y servicio.
5. **Autenticación centralizada** por middleware, no por guard individual por ruta.
6. **Frontend con servicios por módulo** nunca llama endpoints directamente desde componentes.
7. **Especificaciones dinámicas** (Specification Builder) para filtros complejos sin spaguetti de querys.
8. **CORS true** en desarrollo, controlado por `PUBLIC_ROUTES` para rutas públicas.
