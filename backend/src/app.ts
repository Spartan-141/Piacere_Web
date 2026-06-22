import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authRouter } from './modules/auth/auth.router';
import { menuRouter } from './modules/menu/menu.router';
import { ordersRouter } from './modules/orders/orders.router';

import { tablesRouter } from './modules/tables/tables.router';
import { customersRouter } from './modules/customers/customers.router';

dotenv.config();

const app = express();

// ── Middlewares ──────────────────────────────────────────────
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Piacere API' });
});

// ── Routers ──────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);

app.use('/api/tables', tablesRouter);
app.use('/api/customers', customersRouter);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error handler ────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
