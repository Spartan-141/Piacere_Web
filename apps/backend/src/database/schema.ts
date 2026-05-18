export function runMigrations(db: any): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ============================================================
    -- CATÁLOGO DE PRODUCTOS Y MENÚ
    -- ============================================================

    CREATE TABLE IF NOT EXISTS categories (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT NOT NULL,
      slug              TEXT UNIQUE NOT NULL,
      is_visible_on_web INTEGER DEFAULT 1,
      sort_order        INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id     INTEGER REFERENCES categories(id),
      name            TEXT NOT NULL,
      description     TEXT,
      base_price      REAL NOT NULL DEFAULT 0,
      is_active       INTEGER DEFAULT 1,
      is_on_web_menu  INTEGER DEFAULT 1,
      image_url       TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS combos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      description     TEXT,
      price           REAL NOT NULL DEFAULT 0,
      is_active       INTEGER DEFAULT 1,
      is_on_web_menu  INTEGER DEFAULT 1,
      valid_from      TEXT,
      valid_until     TEXT
    );

    CREATE TABLE IF NOT EXISTS combo_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      combo_id    INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id),
      quantity    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS product_extras (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      price       REAL NOT NULL DEFAULT 0,
      is_active   INTEGER DEFAULT 1
    );

    -- ============================================================
    -- USUARIOS, MESAS Y PEDIDOS
    -- ============================================================

    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      email           TEXT UNIQUE,
      phone           TEXT,
      password_hash   TEXT,
      role            TEXT DEFAULT 'customer' CHECK(role IN ('customer','waiter','cashier','admin')),
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label       TEXT,
      address     TEXT NOT NULL,
      city        TEXT,
      is_default  INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS table_sections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      prefix      TEXT NOT NULL,
      is_active   INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tables (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      capacity    INTEGER,
      section_id  INTEGER REFERENCES table_sections(id),
      status      TEXT DEFAULT 'free' CHECK(status IN ('free','waiting_order','served','reserved'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number        TEXT UNIQUE NOT NULL,
      type                TEXT NOT NULL CHECK(type IN ('dine_in','takeaway','delivery','phone')),
      status              TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
      source              TEXT DEFAULT 'pos' CHECK(source IN ('pos','web','phone')),
      table_id            INTEGER REFERENCES tables(id),
      customer_id         INTEGER REFERENCES users(id),
      delivery_address_id INTEGER REFERENCES customer_addresses(id),
      delivery_notes      TEXT,
      subtotal            REAL DEFAULT 0,
      discount            REAL DEFAULT 0,
      tax                 REAL DEFAULT 0,
      total               REAL DEFAULT 0,
      created_by          INTEGER REFERENCES users(id),
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  INTEGER REFERENCES products(id),
      combo_id    INTEGER REFERENCES combos(id),
      quantity    INTEGER NOT NULL DEFAULT 1,
      unit_price  REAL NOT NULL,
      notes       TEXT
    );

    CREATE TABLE IF NOT EXISTS order_item_extras (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id   INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      product_extra_id INTEGER NOT NULL REFERENCES product_extras(id),
      price           REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    INTEGER NOT NULL REFERENCES orders(id),
      method      TEXT NOT NULL CHECK(method IN ('cash_usd','cash_ves','card','transfer','pago_movil','online')),
      amount      REAL NOT NULL,
      reference   TEXT,
      paid_at     TEXT DEFAULT (datetime('now'))
    );
  `);
}
