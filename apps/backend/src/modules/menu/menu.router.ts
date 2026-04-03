import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const menuRouter = Router();

// ── Categorías ──────────────────────────────────────────────
menuRouter.get('/categories', (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  return res.json(cats);
});

// ── Productos ────────────────────────────────────────────────
menuRouter.get('/products', (req, res) => {
  const db = getDb();
  const webOnly = req.query.web === 'true';
  const categoryId = req.query.categoryId;

  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params: any[] = [];
  if (webOnly) { query += ' AND p.is_on_web_menu = 1'; }
  if (categoryId) { query += ' AND p.category_id = ?'; params.push(categoryId); }
  query += ' ORDER BY c.sort_order, p.name';

  const products = db.prepare(query).all(...params) as any[];

  // Adjuntar variantes
  const withVariants = products.map((p) => {
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1').all(p.id);
    return { ...p, variants };
  });

  return res.json(withVariants);
});

menuRouter.get('/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`
  ).get(req.params.id) as any;

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1').all(product.id);
  return res.json({ ...product, variants });
});

const productSchema = z.object({
  categoryId: z.number(),
  name: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  isOnWebMenu: z.boolean().optional().default(true),
  imageUrl: z.string().url().optional(),
});

menuRouter.post('/products', authenticate, requireRole('admin'), validate(productSchema), (req, res) => {
  const db = getDb();
  const { categoryId, name, description, basePrice, isOnWebMenu, imageUrl } = req.body;
  const result = db.prepare(
    'INSERT INTO products (category_id, name, description, base_price, is_on_web_menu, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(categoryId, name, description || null, basePrice, isOnWebMenu ? 1 : 0, imageUrl || null);
  return res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

menuRouter.put('/products/:id', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const { name, description, basePrice, isActive, isOnWebMenu, categoryId } = req.body;
  db.prepare(
    `UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description),
     base_price = COALESCE(?, base_price), is_active = COALESCE(?, is_active),
     is_on_web_menu = COALESCE(?, is_on_web_menu), category_id = COALESCE(?, category_id)
     WHERE id = ?`
  ).run(name, description, basePrice, isActive, isOnWebMenu, categoryId, req.params.id);
  return res.json({ message: 'Producto actualizado' });
});

// ── Combos ───────────────────────────────────────────────────
menuRouter.get('/combos', (req, res) => {
  const db = getDb();
  const webOnly = req.query.web === 'true';
  let query = 'SELECT * FROM combos WHERE is_active = 1';
  if (webOnly) query += ' AND is_on_web_menu = 1';

  const combos = db.prepare(query).all() as any[];
  const withItems = combos.map((combo) => {
    const items = db.prepare(
      `SELECT ci.*, p.name AS product_name, pv.name AS variant_name
       FROM combo_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.combo_id = ?`
    ).all(combo.id);
    return { ...combo, items };
  });
  return res.json(withItems);
});
