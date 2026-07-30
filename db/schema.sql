-- Tare Storefront schema. libSQL/SQLite.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL,             -- cents
  category_slug TEXT NOT NULL REFERENCES categories(slug) ON DELETE CASCADE,
  brand         TEXT NOT NULL,
  rating        REAL NOT NULL DEFAULT 0,
  review_count  INTEGER NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,
  image_url     TEXT,
  tags          TEXT NOT NULL DEFAULT '',     -- comma separated
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand);

CREATE TABLE IF NOT EXISTS cart_lines (
  uid        TEXT NOT NULL,                   -- firebase uid
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (uid, product_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uid               TEXT NOT NULL,                  -- firebase uid
  email             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' -- pending | paid | cancelled
                    CHECK (status IN ('pending', 'paid', 'cancelled')),
  subtotal          INTEGER NOT NULL,               -- cents
  shipping          INTEGER NOT NULL,               -- cents
  discount          INTEGER NOT NULL DEFAULT 0,      -- cents (kupon indirimi)
  coupon            TEXT,                            -- uygulanan kupon kodu
  total             INTEGER NOT NULL,               -- cents (subtotal + shipping - discount)
  currency          TEXT NOT NULL DEFAULT 'USD',
  stripe_session_id TEXT UNIQUE,
  created_at        TEXT NOT NULL,
  paid_at           TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  name       TEXT NOT NULL,                         -- siparis anindaki isim
  price      INTEGER NOT NULL,                      -- siparis anindaki fiyat, cents
  quantity   INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_uid     ON orders(uid);
CREATE INDEX IF NOT EXISTS idx_order_items_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  uid        TEXT NOT NULL,                         -- firebase uid
  author     TEXT NOT NULL,                         -- gorunecek isim
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_uid_product ON reviews(uid, product_id);
