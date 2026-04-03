import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const menuRouter: RouterType = Router();

// ── Categorías ──────────────────────────────────────────────
menuRouter.get('/categories', (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  return res.json(cats);
});

menuRouter.post('/categories', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Faltan campos' });
  try {
    const result = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug);
    return res.status(201).json({ id: result.lastInsertRowid, name, slug });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El slug ya existe' });
    }
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

menuRouter.delete('/categories/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT id FROM products WHERE category_id = ?').all(req.params.id);
  if (products.length > 0) return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene productos asignados.' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Categoría eliminada' });
});

// ── Productos ────────────────────────────────────────────────
menuRouter.get('/products', (req, res) => {
  const db = getDb();
  const webOnly = req.query.web === 'true';
  const showAll = req.query.all === 'true';
  const categoryId = req.query.categoryId;

  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (!showAll) { query += ' AND p.is_active = 1'; }
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
  const id = req.params.id;

  try {
    const result = db.prepare(
      `UPDATE products 
       SET name = ?, description = ?, base_price = ?, is_active = ?, is_on_web_menu = ?, category_id = ?
       WHERE id = ?`
    ).run(
      name, 
      description || null, 
      basePrice, 
      (isActive === true || isActive === 1) ? 1 : 0, 
      (isOnWebMenu === true || isOnWebMenu === 1) ? 1 : 0, 
      categoryId, 
      id
    );
    return res.json({ message: 'Producto actualizado' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

menuRouter.patch('/products/:id/toggle-active', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT is_active FROM products WHERE id = ?').get(req.params.id) as any;
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  const nextStatus = product.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE products SET is_active = ? WHERE id = ?').run(nextStatus, req.params.id);
  return res.json({ message: nextStatus === 1 ? 'Producto activado' : 'Producto ocultado', is_active: nextStatus });
});

menuRouter.delete('/products/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM combo_items WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  })();
  return res.json({ message: 'Producto eliminado físicamente' });
});

// ── Combos ───────────────────────────────────────────────────
menuRouter.get('/combos', (req, res) => {
  const db = getDb();
  const webOnly = req.query.web === 'true';
  const showAll = req.query.all === 'true';
  let query = 'SELECT * FROM combos WHERE 1=1';
  if (!showAll) query += ' AND is_active = 1';
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

const comboSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  isOnWebMenu: z.boolean().optional().default(true),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1)
  })).min(1, 'El combo debe tener al menos un producto')
});

menuRouter.post('/combos', authenticate, requireRole('admin'), validate(comboSchema), (req, res) => {
  const db = getDb();
  const { name, description, price, isOnWebMenu, items } = req.body;
  
  db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO combos (name, description, price, is_on_web_menu) VALUES (?, ?, ?, ?)'
    ).run(name, description, price, isOnWebMenu ? 1 : 0);
    const comboId = r.lastInsertRowid;
    
    const insertItem = db.prepare('INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)');
    for (const item of items) {
      insertItem.run(comboId, item.productId, item.quantity);
    }
  })();
  
  return res.status(201).json({ message: 'Combo creado' });
});

menuRouter.put('/combos/:id', authenticate, requireRole('admin'), validate(comboSchema), (req, res) => {
  const db = getDb();
  const comboId = req.params.id;
  const { name, description, price, isOnWebMenu, items } = req.body;
  
  try {
    db.transaction(() => {
      db.prepare('UPDATE combos SET name=?, description=?, price=?, is_on_web_menu=? WHERE id=?')
        .run(name, description || null, price, isOnWebMenu ? 1 : 0, comboId);
      db.prepare('DELETE FROM combo_items WHERE combo_id=?').run(comboId);
      
      const insertItem = db.prepare('INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)');
      for (const item of items) {
        insertItem.run(comboId, item.productId, item.quantity);
      }
    })();
    return res.json({ message: 'Combo actualizado' });
  } catch (error: any) {
    console.error('Error updating combo:', error);
    return res.status(500).json({ error: 'Error al actualizar combo' });
  }
});

menuRouter.patch('/combos/:id/toggle-active', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const combo = db.prepare('SELECT is_active FROM combos WHERE id = ?').get(id) as any;
  if (!combo) return res.status(404).json({ error: 'Combo no encontrado' });
  const nextStatus = combo.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE combos SET is_active = ? WHERE id = ?').run(nextStatus, id);
  return res.json({ message: nextStatus === 1 ? 'Activo' : 'Oculto', is_active: nextStatus });
});

menuRouter.delete('/combos/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const comboId = req.params.id;
  db.transaction(() => {
    db.prepare('DELETE FROM combo_items WHERE combo_id=?').run(comboId);
    db.prepare('DELETE FROM combos WHERE id=?').run(comboId);
  })();
  return res.json({ message: 'Combo eliminado' });
});
