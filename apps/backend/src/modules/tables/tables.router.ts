import { Router } from 'express';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

export const tablesRouter = Router();

// =============================
// SECTIONS (ZONES)
// =============================

// GET /api/tables/sections
tablesRouter.get('/sections', authenticate, (req, res) => {
  const db = getDb();
  const showAll = req.query.all === 'true';
  const query = `
    SELECT s.*, 
      (SELECT COUNT(*) FROM tables WHERE section_id = s.id) as tableCount
    FROM table_sections s
    ${showAll ? '' : 'WHERE s.is_active = 1'}
    ORDER BY s.name
  `;
  const sections = db.prepare(query).all();
  return res.json(sections);
});

// POST /api/tables/sections
tablesRouter.post('/sections', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, prefix } = req.body;
  const result = db.prepare('INSERT INTO table_sections (name, prefix) VALUES (?, ?)').run(name, prefix);
  return res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/tables/sections/:id
tablesRouter.put('/sections/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, prefix } = req.body;
  db.prepare('UPDATE table_sections SET name = ?, prefix = ? WHERE id = ?').run(name, prefix, req.params.id);
  return res.json({ message: 'Sección actualizada' });
});

// PATCH /api/tables/sections/:id/toggle-active
tablesRouter.patch('/sections/:id/toggle-active', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const sectionId = req.params.id;
  const section = db.prepare('SELECT is_active FROM table_sections WHERE id = ?').get(sectionId) as any;
  if (!section) return res.status(404).json({ error: 'Sección no encontrada' });
  
  const willDeactivate = section.is_active === 1;

  if (willDeactivate) {
    // Validar que no haya mesas ocupadas en esta sección antes de ocultar
    const activeTables = db.prepare("SELECT id FROM tables WHERE section_id = ? AND status != 'free'").all(sectionId);
    if (activeTables.length > 0) {
      return res.status(400).json({ error: 'No se puede ocultar la zona porque tiene mesas ocupadas o reservadas.' });
    }
  }
  
  const nextStatus = willDeactivate ? 0 : 1;
  db.prepare('UPDATE table_sections SET is_active = ? WHERE id = ?').run(nextStatus, sectionId);
  
  return res.json({ message: nextStatus === 1 ? 'Sección activada' : 'Sección ocultada', is_active: nextStatus });
});

// DELETE /api/tables/sections/:id
tablesRouter.delete('/sections/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const sectionId = req.params.id;
  const force = req.query.force === 'true';

  const tables = db.prepare('SELECT id, status FROM tables WHERE section_id = ?').all(sectionId) as any[];
  
  if (tables.length > 0) {
    const occupiedTables = tables.filter(t => t.status !== 'free');
    if (occupiedTables.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la zona porque tiene mesas ocupadas, servidas o reservadas.' });
    }
    
    if (!force) {
      return res.status(400).json({ 
        error: 'CONFIRM_TABLE_DELETE', 
        message: 'Esta zona contiene mesas libres. ¿Estás seguro de que deseas eliminar la zona y TODAS las mesas que contiene?' 
      });
    }
    
    // Si force es true, borrar todas las mesas de la sección
    db.prepare('DELETE FROM tables WHERE section_id = ?').run(sectionId);
  }

  db.prepare('DELETE FROM table_sections WHERE id = ?').run(sectionId);
  return res.json({ message: 'Sección eliminada físicamente' });
});


// =============================
// TABLES
// =============================

// GET /api/tables
tablesRouter.get('/', authenticate, (req, res) => {
  const db = getDb();
  // Solo devolvemos mesas de secciones ACTIVAS
  const tables = db.prepare(`
    SELECT t.*, s.name as sectionName,
      (SELECT o.id FROM orders o WHERE o.table_id = t.id AND o.status NOT IN ('delivered','cancelled') LIMIT 1) AS current_order_id,
      (SELECT o.total FROM orders o WHERE o.table_id = t.id AND o.status NOT IN ('delivered','cancelled') LIMIT 1) AS current_order_total
    FROM tables t
    JOIN table_sections s ON t.section_id = s.id
    WHERE s.is_active = 1
    ORDER BY s.name, t.id
  `).all();
  return res.json(tables);
});

// PATCH /api/tables/:id/status
tablesRouter.patch('/:id/status', authenticate, requireRole('admin', 'cashier', 'waiter'), (req, res) => {
  const db = getDb();
  const { status } = req.body;
  if (!['free', 'waiting_order', 'served', 'reserved'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, req.params.id);
  return res.json({ message: 'Estado de mesa actualizado' });
});

// POST /api/tables
tablesRouter.post('/', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { capacity, sectionId } = req.body;
  
  if (!sectionId) return res.status(400).json({ error: 'sectionId es requerido' });

  // Buscar el prefijo de la seccion
  const section: any = db.prepare('SELECT prefix FROM table_sections WHERE id = ?').get(sectionId);
  if (!section) return res.status(404).json({ error: 'Sección no encontrada' });

  // Contar cuántas mesas hay actualmente en esta sección para nombrar (P1, P2...)
  const countObj: any = db.prepare('SELECT COUNT(*) as cnt FROM tables WHERE section_id = ?').get(sectionId);
  const nextNum = (countObj.cnt || 0) + 1;
  const autoName = `${section.prefix}${nextNum}`;

  const result = db.prepare(
    'INSERT INTO tables (name, capacity, section_id, status) VALUES (?, ?, ?, ?)'
  ).run(autoName, capacity || null, sectionId, 'free');
  
  return res.status(201).json({ id: result.lastInsertRowid, name: autoName });
});

// DELETE /api/tables/:id
tablesRouter.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Mesa eliminada' });
});
