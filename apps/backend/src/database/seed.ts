import bcrypt from 'bcryptjs';
import { getDb } from './client';

const db = getDb();

async function seed() {
  console.log('🌱 Iniciando seed de datos Piacere...');

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM payments; 
    DELETE FROM order_item_extras;
    DELETE FROM order_items; 
    DELETE FROM orders;
    DELETE FROM combo_items; 
    DELETE FROM combos;
    DELETE FROM product_extras;
    DELETE FROM products;
    DELETE FROM customer_addresses;
    DELETE FROM users; 
    DELETE FROM tables; 
    DELETE FROM table_sections; 
    DELETE FROM categories;
    DELETE FROM sqlite_sequence;
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  // --- Categorías ---
  const insertCategory = db.prepare(
    `INSERT INTO categories (name, slug, is_visible_on_web, sort_order) VALUES (?, ?, ?, ?)`
  );
  const resPizzas = insertCategory.run('Pizzas', 'pizzas', 1, 1);
  const resBebidas = insertCategory.run('Bebidas', 'bebidas', 1, 2);

  const catPizzasId = resPizzas.lastInsertRowid;
  const catBebidasId = resBebidas.lastInsertRowid;

  // --- Productos ---
  const insertProduct = db.prepare(
    `INSERT INTO products (category_id, name, description, base_price, is_active, is_on_web_menu)
     VALUES (?, ?, ?, ?, 1, 1)`
  );

  // Pizzas
  insertProduct.run(catPizzasId, 'Margarita', 'Salsa napolitana | mozzarella | albahaca.', 7.00);
  insertProduct.run(catPizzasId, 'Vegetariana', 'Salsa napolitana | mozzarella | aceitunas negras | maíz | champiñones | pimenton | cebolla.', 10.00);
  insertProduct.run(catPizzasId, 'Pepperoni', 'Salsa napolitana | mozzarella | pepperoni | hot honey.', 10.00);
  insertProduct.run(catPizzasId, 'Primavera', 'Salsa napolitana | mozzarella | maíz | jamón.', 10.00);
  insertProduct.run(catPizzasId, 'Maiale', 'Salsa napolitana | mozzarella | tocineta | jamón.', 10.00);
  insertProduct.run(catPizzasId, 'Al Pesto', 'Salsa napolitana | mozzarella | tomates deshidratados | pesto.', 10.00);
  insertProduct.run(catPizzasId, 'Hawaiana', 'Salsa napolitana | mozzarella | chutney de piña | tocineta | jamón.', 12.00);
  insertProduct.run(catPizzasId, 'Carlotta', 'Salsa napolitana | mozzarella | salchichón | maíz | pimenton | cebolla.', 12.00);
  insertProduct.run(catPizzasId, 'Quattro Stagioni', 'Salsa napolitana | mozzarella | 4 presentaciones conformadas por pepperoni + hot honey | jamón + tocineta | tomate deshidratado + pesto | champiñones + aceitunas negras.', 12.00);
  insertProduct.run(catPizzasId, 'Miami Style', 'Salsa napolitana | mozzarella | pepperoni | hot honey | albahaca | pimienta | queso crema.', 14.00);
  insertProduct.run(catPizzasId, 'Ragazza', 'Salsa napolitina | mozzarella | tocineta | queso crema | champiñones | oregano | pepperoccini.', 14.00);
  insertProduct.run(catPizzasId, 'Piacere', 'Salsa napolitana | mozzarella | tocineta | jamón | pepperoni | champiñones | maíz | aceitunas negras | tomates deshidratados | pesto.', 15.00);
  insertProduct.run(catPizzasId, 'La Cúspide', 'Salsa napolitana | mozzarella | mortadela de pistachos | pistacho triturado | rugula | AOEV.', 16.00);
  insertProduct.run(catPizzasId, 'Prosciutto', 'Salsa napolitina | mozzarella | prosciutto | parmigiano reggiano | rúgula | AOEV.', 16.00);

  // Bebidas
  insertProduct.run(catBebidasId, 'Nestea Peq', null, 1.50);
  insertProduct.run(catBebidasId, 'Nestea Gr', null, 2.50);
  insertProduct.run(catBebidasId, 'Refresco 1lt', null, 2.50);
  insertProduct.run(catBebidasId, 'Refresco 2lt', null, 4.00);
  insertProduct.run(catBebidasId, 'Agua 600ml', null, 1.50);
  insertProduct.run(catBebidasId, 'Refresco Lata', null, 2.00);

  // --- Adicionales / Extras ---
  const insertExtra = db.prepare(
    `INSERT INTO product_extras (name, price, is_active) VALUES (?, ?, 1)`
  );
  const extras = [
    { n: 'Hot honey', p: 1.50 },
    { n: 'Cebolla y pimentón', p: 1.50 },
    { n: 'Maíz', p: 1.50 },
    { n: 'Aceitunas negras', p: 2.00 },
    { n: 'Tomates deshidratados', p: 2.00 },
    { n: 'Champiñones', p: 2.00 },
    { n: 'Jamón', p: 2.00 },
    { n: 'Pepperoni', p: 2.00 },
    { n: 'Queso crema', p: 3.00 },
    { n: 'Pesto', p: 2.00 },
    { n: 'Rúgula', p: 2.00 },
    { n: 'Pistachos', p: 2.00 },
    { n: 'Pecorino', p: 3.00 },
    { n: 'Parmesano', p: 3.00 },
    { n: 'Tocineta', p: 2.50 },
    { n: 'Borde de queso', p: 4.00 },
    { n: 'Extra queso', p: 4.00 },
    { n: 'Mortadela', p: 6.00 },
    { n: 'Salchichón', p: 6.00 },
    { n: 'Anchoas', p: 6.00 },
    { n: 'Prosciutto', p: 6.00 }
  ];

  for (const extra of extras) {
    insertExtra.run(extra.n, extra.p);
  }

  // --- Mesas y Secciones ---
  const insertSection = db.prepare(`INSERT INTO table_sections (name, prefix) VALUES (?, ?)`);
  const s1 = insertSection.run('Principal', 'P');
  const s2 = insertSection.run('Terraza', 'T');

  const insertTable = db.prepare(
    `INSERT INTO tables (name, capacity, section_id, status) VALUES (?, ?, ?, 'free')`
  );
  insertTable.run('P1', 4, s1.lastInsertRowid);
  insertTable.run('P2', 4, s1.lastInsertRowid);
  insertTable.run('P3', 6, s1.lastInsertRowid);
  insertTable.run('T1', 4, s2.lastInsertRowid);
  insertTable.run('T2', 6, s2.lastInsertRowid);

  // --- Usuarios ---
  const adminHash = bcrypt.hashSync('admin123', 10);
  const cashierHash = bcrypt.hashSync('cajero123', 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`
  );
  insertUser.run('Administrador Piacere', 'admin@piacere.com', '+1234567890', adminHash, 'admin');
  insertUser.run('Cajero Piacere', 'cajero@piacere.com', '+0987654321', cashierHash, 'cashier');

  console.log('✅ Seed completado exitosamente con nuevo menú de pizzas.');
  console.log('');
  console.log('📋 Credenciales de acceso:');
  console.log('   Admin:   admin@piacere.com   / admin123');
  console.log('   Cajero:  cajero@piacere.com  / cajero123');
  
  db.close();
}

seed();
