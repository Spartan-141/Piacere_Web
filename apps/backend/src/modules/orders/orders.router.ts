import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const ordersRouter = Router();

// Generar número de orden único
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${year}-${rand}`;
}


const createOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery', 'phone']),
  source: z.enum(['pos', 'web', 'phone']).optional().default('pos'),
  tableId: z.number().optional(),
  customerId: z.number().optional(),
  deliveryAddressId: z.number().optional(),
  deliveryNotes: z.string().optional(),
  discount: z.number().min(0).optional().default(0),
  items: z.array(z.object({
    productId: z.number().optional(),
    extraIds: z.array(z.number()).optional(),
    comboId: z.number().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

// GET /api/orders
ordersRouter.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { status, tableId, date } = req.query;
  let query = `
    SELECT o.*, t.name AS table_name,
           u.name AS customer_name,
           creator.name AS created_by_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN users u ON o.customer_id = u.id
    LEFT JOIN users creator ON o.created_by = creator.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (tableId) { query += ' AND o.table_id = ?'; params.push(tableId); }
  if (date) { query += " AND date(o.created_at) = ?"; params.push(date); }
  query += ' ORDER BY o.created_at DESC LIMIT 100';

  return res.json(db.prepare(query).all(...params));
});

// GET /api/orders/:id
ordersRouter.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, t.name AS table_name, u.name AS customer_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN users u ON o.customer_id = u.id
    WHERE o.id = ?
  `).get(req.params.id) as any;

  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const rawItems = db.prepare(`
    SELECT oi.*, p.name AS product_name, c.name AS combo_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN combos c ON oi.combo_id = c.id
    WHERE oi.order_id = ?
  `).all(order.id) as any[];

  const items = rawItems.map((oi) => {
    const extras = db.prepare(`
      SELECT e.id, e.name, oie.price
      FROM order_item_extras oie
      JOIN product_extras e ON oie.product_extra_id = e.id
      WHERE oie.order_item_id = ?
    `).all(oi.id);
    return { ...oi, extras };
  });

  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(order.id);

  return res.json({ ...order, items, payments });
});

// POST /api/orders
ordersRouter.post('/', authenticate, validate(createOrderSchema), (req, res) => {
  const db = getDb();
  const { type, source, tableId, customerId, deliveryAddressId, deliveryNotes, discount, items } = req.body;

  const subtotal = items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
  const total = subtotal - (discount || 0);

  const insertOrder = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (order_number, type, source, table_id, customer_id, delivery_address_id, delivery_notes,
                          subtotal, discount, total, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateOrderNumber(), type, source, tableId || null, customerId || null,
      deliveryAddressId || null, deliveryNotes || null,
      subtotal, discount || 0, total, req.user!.userId
    );

    const orderId = orderResult.lastInsertRowid;

    for (const item of items) {
      const oiResult = db.prepare(`
        INSERT INTO order_items (order_id, product_id, combo_id, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, item.productId || null, item.comboId || null,
             item.quantity, item.unitPrice, item.notes || null);
             
      const orderItemId = oiResult.lastInsertRowid;
      
      if (item.extraIds && item.extraIds.length > 0) {
        for (const extraId of item.extraIds) {
          const extra = db.prepare('SELECT price FROM product_extras WHERE id = ?').get(extraId) as any;
          if (extra) {
            db.prepare(`
              INSERT INTO order_item_extras (order_item_id, product_extra_id, price)
              VALUES (?, ?, ?)
            `).run(orderItemId, extraId, extra.price);
          }
        }
      }
    }

    // Actualizar estado de mesa
    if (tableId && type === 'dine_in') {
      db.prepare("UPDATE tables SET status = 'waiting_order' WHERE id = ?").run(tableId);
    }

    return orderId;
  });

  const newId = insertOrder();
  return res.status(201).json({ id: newId, message: 'Pedido creado exitosamente' });
});

// PATCH /api/orders/:id/status
ordersRouter.patch('/:id/status', authenticate, (req, res) => {
  const db = getDb();
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const updateAndDeduct = db.transaction(() => {
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, req.params.id);

    // Liberar mesa al cerrar pedido
    if ((status === 'delivered' || status === 'cancelled') && order.table_id) {
      db.prepare("UPDATE tables SET status = 'free' WHERE id = ?").run(order.table_id);
    }
  });

  updateAndDeduct();
  return res.json({ message: 'Estado actualizado' });
});

// POST /api/orders/:id/payments
ordersRouter.post('/:id/payments', authenticate, (req, res) => {
  const db = getDb();
  const { method, amount, reference } = req.body;
  db.prepare('INSERT INTO payments (order_id, method, amount, reference) VALUES (?, ?, ?, ?)')
    .run(req.params.id, method, amount, reference || null);
  return res.status(201).json({ message: 'Pago registrado' });
});
