import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../database/client';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

// POST /api/auth/register
authRouter.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, phone } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, phone || null, hash, 'customer');

  const token = jwt.sign(
    { userId: result.lastInsertRowid, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );

  return res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email, phone: phone || null, role: 'customer' },
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.created_at });
});
