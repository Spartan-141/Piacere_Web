import bcrypt from 'bcryptjs';
import { getDb } from './client';

const db = getDb();
// runMigrations(db); ya lo hace getDb()

async function seed() {
  console.log('🌱 Iniciando seed de datos...');

  // Limpiar datos previos
  db.exec(`
    DELETE FROM payments; DELETE FROM order_items; DELETE FROM orders;
    DELETE FROM combo_items; DELETE FROM combos;
    DELETE FROM product_variants; DELETE FROM products;
    DELETE FROM customer_addresses;
    DELETE FROM users; DELETE FROM tables; DELETE FROM table_sections; DELETE FROM categories;
  `);

  // --- Categorías ---
  const insertCategory = db.prepare(
    `INSERT INTO categories (name, slug, is_visible_on_web, sort_order) VALUES (?, ?, ?, ?)`
  );
  insertCategory.run('Pizzas', 'pizzas', 1, 1);
  insertCategory.run('Pastas', 'pastas', 1, 2);
  insertCategory.run('Entradas', 'entradas', 1, 3);
  insertCategory.run('Bebidas', 'bebidas', 1, 4);
  insertCategory.run('Postres', 'postres', 1, 5);

  // --- Productos ---
  const insertProduct = db.prepare(
    `INSERT INTO products (category_id, name, description, base_price, is_active, is_on_web_menu)
     VALUES (?, ?, ?, ?, 1, 1)`
  );

  // Pizzas (cat 1)
  const p1 = insertProduct.run(1, 'Margherita', 'Salsa de tomate, mozzarella fresca, albahaca', 12.50);
  const p2 = insertProduct.run(1, 'Pepperoni', 'Salsa de tomate, mozzarella, pepperoni artesanal', 14.00);
  const p3 = insertProduct.run(1, 'Quattro Formaggi', 'Mozzarella, parmesano, gorgonzola y brie', 16.00);
  const p4 = insertProduct.run(1, 'Mushroom & Truffle', 'Crema de trufa, champiñones mixtos, mozzarella', 18.00);
  const p5 = insertProduct.run(1, 'BBQ Chicken', 'Salsa BBQ, pollo a la brasa, cebolla caramelizada', 15.00);
  // Pastas (cat 2)
  const p6 = insertProduct.run(2, 'Carbonara', 'Spaghetti, guanciale, yema de huevo, pecorino', 13.00);
  const p7 = insertProduct.run(2, 'Pesto Genovese', 'Penne, pesto de albahaca, piñones, parmesano', 12.00);
  // Entradas (cat 3)
  const p8 = insertProduct.run(3, 'Pan de Ajo', 'Focaccia artesanal con mantequilla de ajo y hierbas', 5.00);
  // Bebidas (cat 4)
  const p9 = insertProduct.run(4, 'Limonada Italiana', 'Limón, agua con gas, jarabe de caña', 4.00);
  const p10 = insertProduct.run(4, 'Té Frío de Durazno', 'Té negro, durazno, menta fresca', 3.50);

  // --- Variantes de tamaño para pizzas ---
  const insertVariant = db.prepare(
    `INSERT INTO product_variants (product_id, name, price_delta, is_active) VALUES (?, ?, ?, 1)`
  );
  for (const pid of [p1.lastInsertRowid, p2.lastInsertRowid, p3.lastInsertRowid, p4.lastInsertRowid, p5.lastInsertRowid]) {
    insertVariant.run(pid, 'Personal (25cm)', -3.00);
    insertVariant.run(pid, 'Mediana (30cm)', 0);
    insertVariant.run(pid, 'Familiar (40cm)', 5.00);
  }

  // --- Combos ---
  const insertCombo = db.prepare(
    `INSERT INTO combos (name, description, price, is_active, is_on_web_menu) VALUES (?, ?, ?, 1, 1)`
  );
  const c1 = insertCombo.run('Combo Pareja', '2 Pizzas Medianas + 2 Bebidas', 26.00);
  const c2 = insertCombo.run('Combo Familia', '1 Pizza Familiar + Pan de Ajo + 4 Bebidas', 34.00);

  const insertComboItem = db.prepare(
    `INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)`
  );
  insertComboItem.run(c1.lastInsertRowid, p1.lastInsertRowid, 1);
  insertComboItem.run(c1.lastInsertRowid, p2.lastInsertRowid, 1);
  insertComboItem.run(c1.lastInsertRowid, p9.lastInsertRowid, 2);
  insertComboItem.run(c2.lastInsertRowid, p3.lastInsertRowid, 1);
  insertComboItem.run(c2.lastInsertRowid, p8.lastInsertRowid, 1);
  insertComboItem.run(c2.lastInsertRowid, p9.lastInsertRowid, 4);


  // --- Mesas y Secciones ---
  const insertSection = db.prepare(`INSERT INTO table_sections (name, prefix) VALUES (?, ?)`);
  const s1 = insertSection.run('Principal', 'P');
  const s2 = insertSection.run('Terraza', 'T');
  const s3 = insertSection.run('Barra', 'B');

  const insertTable = db.prepare(
    `INSERT INTO tables (name, capacity, section_id, status) VALUES (?, ?, ?, 'free')`
  );
  insertTable.run('P1', 4, s1.lastInsertRowid);
  insertTable.run('P2', 4, s1.lastInsertRowid);
  insertTable.run('P3', 6, s1.lastInsertRowid);
  insertTable.run('P4', 2, s1.lastInsertRowid);
  insertTable.run('T1', 4, s2.lastInsertRowid);
  insertTable.run('T2', 6, s2.lastInsertRowid);
  insertTable.run('T3', 4, s2.lastInsertRowid);
  insertTable.run('B1', 2, s3.lastInsertRowid);
  insertTable.run('B2', 2, s3.lastInsertRowid);

  // --- Usuarios ---
  const adminHash = bcrypt.hashSync('admin123', 10);
  const cashierHash = bcrypt.hashSync('cajero123', 10);
  const customerHash = bcrypt.hashSync('cliente123', 10);

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`
  );
  insertUser.run('Administrador Piacere', 'admin@piacere.com', '+1234567890', adminHash, 'admin');
  insertUser.run('Carlos Cajero', 'cajero@piacere.com', '+0987654321', cashierHash, 'cashier');
  insertUser.run('María García', 'maria@example.com', '+5551234567', customerHash, 'customer');

  console.log('✅ Seed completado exitosamente.');
  console.log('');
  console.log('📋 Credenciales de acceso:');
  console.log('   Admin:   admin@piacere.com   / admin123');
  console.log('   Cajero:  cajero@piacere.com  / cajero123');
  console.log('   Cliente: maria@example.com   / cliente123');
  
  db.close();
}

seed();
