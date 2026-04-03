import { Router } from 'express';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

export const customersRouter = Router();

// GET /api/customers
customersRouter.get('/', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const { search } = req.query;
  let query = `
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total), 0) AS total_spent
    FROM users u
    LEFT JOIN orders o ON o.customer_id = u.id AND o.status = 'delivered'
    WHERE u.role = 'customer'
  `;
  const params: any[] = [];
  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  query += ' GROUP BY u.id ORDER BY total_spent DESC';
  return res.json(db.prepare(query).all(...params));
});

// GET /api/customers/:id
customersRouter.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const customer = db.prepare(
    'SELECT id, name, email, phone, created_at FROM users WHERE id = ? AND role = \'customer\''
  ).get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });

  const orders = db.prepare(
    'SELECT id, order_number, type, status, total, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.params.id);

  const addresses = db.prepare('SELECT * FROM customer_addresses WHERE user_id = ?').all(req.params.id);

  return res.json({ ...customer, orders, addresses });
});

// POST /api/customers/:id/addresses
customersRouter.post('/:id/addresses', authenticate, (req, res) => {
  const db = getDb();
  const { label, address, city, isDefault } = req.body;
  if (isDefault) {
    db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?').run(req.params.id);
  }
  const result = db.prepare(
    'INSERT INTO customer_addresses (user_id, label, address, city, is_default) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, label || null, address, city || null, isDefault ? 1 : 0);
  return res.status(201).json({ id: result.lastInsertRowid });
});
