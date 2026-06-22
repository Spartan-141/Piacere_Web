import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const ordersRouter = Router();

function generateOrderNumber(db: any): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${year}-${rand}`;
}

function insertOrderWithRetry(db: any, type: string, source: string, tableId: number | null, customerId: number | null, deliveryAddressId: number | null, deliveryNotes: string | null, subtotal: number, discount: number, paid: boolean, userId: number, tip: number, items: any[]): number | null {
  // P2-5: Validate all extraIds exist
  const allExtraIds: number[] = [];
  for (const item of items) {
    if (item.extraIds && item.extraIds.length > 0) {
      allExtraIds.push(...item.extraIds);
    }
  }
  if (allExtraIds.length > 0) {
    const existingExtras = db.prepare(`SELECT id FROM product_extras WHERE id IN (${allExtraIds.map(() => '?').join(',')})`).all(...allExtraIds) as any[];
    const existingIds = new Set(existingExtras.map((e: any) => e.id));
    const missingIds = allExtraIds.filter(id => !existingIds.has(id));
    if (missingIds.length > 0) {
      throw new Error(`Extras no encontrados: ${missingIds.join(', ')}`);
    }
  }
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, type, source, table_id, customer_id, delivery_address_id, delivery_notes,
                          subtotal, discount, total, tax, paid, created_by, tip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        generateOrderNumber(db), type, source ?? 'pos',
        (type === 'dine_in' ? tableId : null) || null, customerId || null,
        deliveryAddressId || null, deliveryNotes || null,
        subtotal, discount || 0, subtotal - (discount || 0), (subtotal - (discount || 0)) * 0.16, paid ? 1 : 0,
        userId, tip || 0
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

      if (tableId && type === 'dine_in') {
        db.prepare("UPDATE tables SET status = 'waiting_order' WHERE id = ?").run(tableId);
      }

      return orderId;
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT' && attempts < maxAttempts) {
        continue;
      }
      throw err;
    }
  }
  return null;
}

const createOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery', 'phone']),
  source: z.enum(['pos', 'web', 'phone']).optional().default('pos'),
  tableId: z.number().optional().nullable(),
  customerId: z.number().optional().nullable(),
  deliveryAddressId: z.number().optional().nullable(),
  deliveryNotes: z.string().optional(),
  discount: z.number().min(0).optional().default(0),
  paid: z.boolean().optional().default(false),
  tip: z.number().min(0).optional().default(0),
  items: z.array(z.object({
    productId: z.number().optional(),
    extraIds: z.array(z.number()).optional(),
    comboId: z.number().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

const addItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.number().optional(),
    extraIds: z.array(z.number()).optional(),
    comboId: z.number().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1)
});

const changeTableSchema = z.object({
  tableId: z.number().optional().nullable()
});

const changeTypeSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery', 'phone'])
});

const changeStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
});

const paymentSchema = z.object({
  method: z.enum(['cash_usd', 'cash_ves', 'card', 'transfer', 'pago_movil', 'online']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  tip: z.number().positive().optional()
});

// GET /api/orders — returns all non-archived orders with payment info
ordersRouter.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { status, paid, tableId, date, limit = '50', offset = '0' } = req.query;
  let query = `
    SELECT o.*,
           t.name AS table_name,
           u.name AS customer_name,
           creator.name AS created_by_name,
           COALESCE(SUM(p.amount), 0) AS total_paid,
           COUNT(p.id) AS payment_count
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN users u ON o.customer_id = u.id
    LEFT JOIN users creator ON o.created_by = creator.id
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.status NOT IN ('delivered', 'cancelled')
  `;
  const params: any[] = [];
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (paid !== undefined) { query += ' AND o.paid = ?'; params.push(paid === 'true' ? 1 : 0); }
  if (tableId) { query += ' AND o.table_id = ?'; params.push(tableId); }
  if (date) { query += " AND date(o.created_at) = ?"; params.push(date); }
  query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string), parseInt(offset as string));

  return res.json(db.prepare(query).all(...params));
});

// GET /api/orders/history — archived (delivered/cancelled)
ordersRouter.get('/history', authenticate, (req, res) => {
  const db = getDb();
  const { date } = req.query;
  let query = `
    SELECT o.*, t.name AS table_name, u.name AS customer_name,
           creator.name AS created_by_name,
           COALESCE(SUM(p.amount), 0) AS total_paid,
           COUNT(p.id) AS payment_count
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN users u ON o.customer_id = u.id
    LEFT JOIN users creator ON o.created_by = creator.id
    LEFT JOIN payments p ON o.id = p.order_id
    WHERE o.status IN ('delivered', 'cancelled')
  `;
  const params: any[] = [];
  if (date) { query += " AND date(o.created_at) = ?"; params.push(date); }
  query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100';
  return res.json(db.prepare(query).all(...params));
});

// GET /api/orders/:id
ordersRouter.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, t.name AS table_name, u.name AS customer_name,
           COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) AS total_paid,
           (SELECT COUNT(*) FROM payments WHERE order_id = o.id) AS payment_count
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

  // P1-1: Fix N+1 by fetching all extras in one query
  const itemIds = rawItems.map((oi: any) => oi.id);
  const allExtras = itemIds.length > 0 
    ? db.prepare(`
        SELECT e.id, e.name, oie.price, oie.order_item_id
        FROM order_item_extras oie
        JOIN product_extras e ON oie.product_extra_id = e.id
        WHERE oie.order_item_id IN (${itemIds.map(() => '?').join(',')})
      `).all(...itemIds) as any[]
    : [];

  const extrasByItemId = new Map<number, any[]>();
  allExtras.forEach((e: any) => {
    const existing = extrasByItemId.get(e.order_item_id) || [];
    existing.push({ id: e.id, name: e.name, price: e.price });
    extrasByItemId.set(e.order_item_id, existing);
  });

  const items = rawItems.map((oi: any) => ({ ...oi, extras: extrasByItemId.get(oi.id) || [] }));

  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at ASC').all(order.id);

  return res.json({ ...order, items, payments });
});

// POST /api/orders — create order
ordersRouter.post('/', authenticate, validate(createOrderSchema), (req, res) => {
  const db = getDb();
  const { type, source, tableId, customerId, deliveryAddressId, deliveryNotes, discount, paid, items, tip } = req.body;

  // P1-4: Verify table is free before assigning
  if (tableId && type === 'dine_in') {
    const table = db.prepare('SELECT status FROM tables WHERE id = ?').get(tableId) as any;
    if (!table) return res.status(400).json({ error: 'Mesa no encontrada' });
    if (table.status !== 'free') return res.status(409).json({ error: 'La mesa no está disponible' });
  }

  const subtotal = items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
  
  try {
    const orderId = insertOrderWithRetry(db, type, source, tableId, customerId, deliveryAddressId, deliveryNotes, subtotal, discount || 0, paid || false, req.user!.userId, tip || 0, items);
    if (!orderId) return res.status(500).json({ error: 'Error al crear el pedido' });
    return res.status(201).json({ id: orderId, orderNumber: generateOrderNumber(db), total: subtotal - discount, paid: paid || false, message: 'Pedido creado exitosamente' });
  } catch (err: any) {
    if (err.message?.startsWith('Extras no encontrados')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error al crear el pedido' });
  }
});

// PATCH /api/orders/:id/add-items — add items to an existing order
ordersRouter.patch('/:id/add-items', authenticate, validate(addItemsSchema), (req, res) => {
  const db = getDb();
  const { items } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const addItems = db.transaction(() => {
    let addedSubtotal = 0;
    for (const item of items) {
      const oiResult = db.prepare(`
        INSERT INTO order_items (order_id, product_id, combo_id, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(order.id, item.productId || null, item.comboId || null,
             item.quantity, item.unitPrice, item.notes || null);
            
      const orderItemId = oiResult.lastInsertRowid;
      addedSubtotal += item.unitPrice * item.quantity;
      
      if (item.extraIds && item.extraIds.length > 0) {
        for (const extraId of item.extraIds) {
          const extra = db.prepare('SELECT price FROM product_extras WHERE id = ?').get(extraId) as any;
          if (extra) {
            db.prepare(`INSERT INTO order_item_extras (order_item_id, product_extra_id, price) VALUES (?, ?, ?)`)
              .run(orderItemId, extraId, extra.price);
          }
        }
      }
    }
    const newSubtotal = order.subtotal + addedSubtotal;
    const newTotal = newSubtotal - order.discount;
    db.prepare(`UPDATE orders SET subtotal = ?, total = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(newSubtotal, newTotal, order.id);
    return { addedSubtotal, newTotal };
  });

  const result = addItems();
  return res.json({ message: 'Ítems agregados', ...result });
});

// PATCH /api/orders/:id/table — change the table of an order
ordersRouter.patch('/:id/table', authenticate, validate(changeTableSchema), (req, res) => {
  const db = getDb();
  const { tableId } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  db.transaction(() => {
    if (order.table_id) {
      db.prepare("UPDATE tables SET status = 'free' WHERE id = ?").run(order.table_id);
    }
    if (tableId) {
      db.prepare("UPDATE tables SET status = 'waiting_order' WHERE id = ?").run(tableId);
      db.prepare(`UPDATE orders SET table_id = ?, type = 'dine_in', updated_at = datetime('now') WHERE id = ?`)
        .run(tableId, order.id);
    } else {
      const newType = order.type === 'dine_in' ? 'takeaway' : order.type;
      db.prepare(`UPDATE orders SET table_id = null, type = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(newType, order.id);
    }
  })();

  return res.json({ message: 'Mesa actualizada' });
});

// PATCH /api/orders/:id/type — change the order type
ordersRouter.patch('/:id/type', authenticate, validate(changeTypeSchema), (req, res) => {
  const db = getDb();
  const { type } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  db.transaction(() => {
    if (type !== 'dine_in' && order.table_id) {
      db.prepare("UPDATE tables SET status = 'free' WHERE id = ?").run(order.table_id);
      db.prepare(`UPDATE orders SET type = ?, table_id = null, updated_at = datetime('now') WHERE id = ?`)
        .run(type, order.id);
    } else {
      db.prepare(`UPDATE orders SET type = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(type, order.id);
    }
  })();

  return res.json({ message: 'Tipo de pedido actualizado' });
});

// PATCH /api/orders/:id/status
ordersRouter.patch('/:id/status', authenticate, requireRole('admin', 'cashier', 'waiter'), validate(changeStatusSchema), (req, res) => {
  const db = getDb();
  const { status } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  db.transaction(() => {
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, req.params.id);
    if ((status === 'delivered' || status === 'cancelled') && order.table_id) {
      db.prepare("UPDATE tables SET status = 'free' WHERE id = ?").run(order.table_id);
    }
  })();

  return res.json({ message: 'Estado actualizado' });
});

// POST /api/orders/:id/payments — register a payment and mark order as paid
ordersRouter.post('/:id/payments', authenticate, requireRole('admin', 'cashier'), validate(paymentSchema), (req, res) => {
  const db = getDb();
  const { method, amount, reference, tip } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  db.transaction(() => {
    db.prepare('INSERT INTO payments (order_id, method, amount, reference) VALUES (?, ?, ?, ?)')
      .run(req.params.id, method, amount, reference || null);
    
    if (tip !== undefined) {
      db.prepare(`UPDATE orders SET paid = 1, tip = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(tip, req.params.id);
    } else {
      db.prepare(`UPDATE orders SET paid = 1, updated_at = datetime('now') WHERE id = ?`)
        .run(req.params.id);
    }
  })();

  return res.status(201).json({ message: 'Pago registrado' });
});
