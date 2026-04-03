import { Router } from 'express';
import { getDb } from '../../database/client';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

export const inventoryRouter = Router();

// ── Materias Primas ──────────────────────────────────────────
inventoryRouter.get('/materials', authenticate, (req, res) => {
  const db = getDb();
  const materials = db.prepare('SELECT * FROM raw_materials ORDER BY name').all();
  return res.json(materials);
});

inventoryRouter.post('/materials', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const { name, unit, stockQuantity, minStockAlert, costPerUnit } = req.body;
  const result = db.prepare(
    'INSERT INTO raw_materials (name, unit, stock_quantity, min_stock_alert, cost_per_unit) VALUES (?, ?, ?, ?, ?)'
  ).run(name, unit, stockQuantity || 0, minStockAlert || 0, costPerUnit || null);
  return res.status(201).json({ id: result.lastInsertRowid });
});

inventoryRouter.put('/materials/:id', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const { name, unit, stockQuantity, minStockAlert, costPerUnit } = req.body;
  db.prepare(
    `UPDATE raw_materials SET
       name = COALESCE(?, name),
       unit = COALESCE(?, unit),
       stock_quantity = COALESCE(?, stock_quantity),
       min_stock_alert = COALESCE(?, min_stock_alert),
       cost_per_unit = COALESCE(?, cost_per_unit),
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, unit, stockQuantity, minStockAlert, costPerUnit, req.params.id);
  return res.json({ message: 'Materia prima actualizada' });
});

// POST /api/inventory/materials/:id/adjust — ajuste manual de stock
inventoryRouter.post('/materials/:id/adjust', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const { quantityDelta, type, notes } = req.body;
  const adjust = db.transaction(() => {
    db.prepare(
      "UPDATE raw_materials SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?"
    ).run(quantityDelta, req.params.id);
    db.prepare(
      'INSERT INTO inventory_movements (raw_material_id, type, quantity_delta, notes, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, type || 'manual_adjustment', quantityDelta, notes || null, req.user!.userId);
  });
  adjust();
  return res.json({ message: 'Stock ajustado' });
});

// ── Recetas (Escandallo) ─────────────────────────────────────
inventoryRouter.get('/recipes', authenticate, (req, res) => {
  const db = getDb();
  const recipes = db.prepare(`
    SELECT r.*, p.name AS product_name, pv.name AS variant_name
    FROM recipes r
    JOIN products p ON r.product_id = p.id
    LEFT JOIN product_variants pv ON r.variant_id = pv.id
    ORDER BY p.name
  `).all() as any[];

  const withIngredients = recipes.map((recipe) => {
    const ingredients = db.prepare(`
      SELECT ri.*, rm.name AS raw_material_name, rm.unit
      FROM recipe_ingredients ri
      JOIN raw_materials rm ON ri.raw_material_id = rm.id
      WHERE ri.recipe_id = ?
    `).all(recipe.id);
    return { ...recipe, ingredients };
  });
  return res.json(withIngredients);
});

inventoryRouter.post('/recipes', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { productId, variantId, ingredients } = req.body;

  const createRecipe = db.transaction(() => {
    const recipeResult = db.prepare(
      'INSERT INTO recipes (product_id, variant_id) VALUES (?, ?)'
    ).run(productId, variantId || null);
    const recipeId = recipeResult.lastInsertRowid;

    for (const ing of ingredients) {
      db.prepare(
        'INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity) VALUES (?, ?, ?)'
      ).run(recipeId, ing.rawMaterialId, ing.quantity);
    }
    return recipeId;
  });

  const newId = createRecipe();
  return res.status(201).json({ id: newId });
});

// ── Movimientos ──────────────────────────────────────────────
inventoryRouter.get('/movements', authenticate, requireRole('admin', 'cashier'), (req, res) => {
  const db = getDb();
  const movements = db.prepare(`
    SELECT im.*, rm.name AS raw_material_name, u.name AS created_by_name
    FROM inventory_movements im
    JOIN raw_materials rm ON im.raw_material_id = rm.id
    LEFT JOIN users u ON im.created_by = u.id
    ORDER BY im.created_at DESC LIMIT 200
  `).all();
  return res.json(movements);
});

// GET /api/inventory/alerts — materias primas bajo mínimo
inventoryRouter.get('/alerts', authenticate, (req, res) => {
  const db = getDb();
  const alerts = db.prepare(
    'SELECT * FROM raw_materials WHERE stock_quantity <= min_stock_alert ORDER BY name'
  ).all();
  return res.json(alerts);
});
