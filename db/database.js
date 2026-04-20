const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'eat_a_lot.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    emoji     TEXT NOT NULL,
    slug      TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    active    INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name        TEXT NOT NULL,
    description TEXT,
    price       REAL NOT NULL,
    emoji       TEXT DEFAULT '🍴',
    is_veg      INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    available   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref   TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    items_json  TEXT NOT NULL,
    total       REAL NOT NULL,
    status      TEXT DEFAULT 'pending',
    note        TEXT,
    source      TEXT DEFAULT 'website',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Keep seed data idempotent across repeated server starts.
db.exec(`
  DELETE FROM menu_items
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM menu_items
    GROUP BY category_id, name
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_category_name
  ON menu_items(category_id, name);
`);

// ─── SEED CATEGORIES ───────────────────────────────────────
const seedCategories = db.prepare('INSERT OR IGNORE INTO categories (name, emoji, slug, sort_order) VALUES (?, ?, ?, ?)');
const cats = [
  ['Maggie', '🍜', 'maggie', 1],
  ['Burgers', '🍔', 'burgers', 2],
  ['Sandwiches', '🥪', 'sandwiches', 3],
  ['Fries', '🍟', 'fries', 4],
  ['Egg Specials', '🍳', 'egg-specials', 5],
  ['Drinks', '🥤', 'drinks', 6],
  ['Pasta', '🍝', 'pasta', 7],
  ['Add-Ons', '🧀', 'add-ons', 8],
];
cats.forEach(c => seedCategories.run(...c));

// ─── SEED MENU ──────────────────────────────────────────────
const getCatId = db.prepare('SELECT id FROM categories WHERE slug = ?');
const seedItem = db.prepare(`
  INSERT INTO menu_items (category_id, name, description, price, emoji, is_veg, is_featured, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(category_id, name) DO UPDATE SET
    description = excluded.description,
    price = excluded.price,
    emoji = excluded.emoji,
    is_veg = excluded.is_veg,
    is_featured = excluded.is_featured,
    sort_order = excluded.sort_order,
    updated_at = datetime('now')
`);

const menuSeed = [
  // Maggie
  ['maggie', 'Pahadi Masala Maggie', 'Classic hill-station masala with a bold, rustic spice blend.', 59, '🍜', 1, 0, 1],
  ['maggie', 'Special Pahadi Vegii Maggie', 'Loaded with fresh veggies and Pahadi spice. A mountain staple.', 79, '🥦', 1, 0, 2],
  ['maggie', 'Spicy Pahadi Sezwan Maggie', 'Fiery sezwan sauce tossed into Pahadi-style maggie noodles.', 79, '🌶️', 1, 1, 3],
  ['maggie', 'Super Cheeseeee Maggie', 'Noodles drowned in rivers of melted cheese + secret spice.', 89, '🧀', 1, 1, 4],
  ['maggie', 'Chatpata Paneer Maggi', 'Tangy paneer chunks in our signature chatpata masala.', 89, '🧆', 1, 0, 5],
  ['maggie', 'Tangy Mushroom Maggie', 'Earthy mushrooms in a tangy, aromatic signature sauce.', 89, '🍄', 1, 1, 6],
  ['maggie', 'Egg Chicken Maggie', 'Juicy chicken and egg elevated into maggie perfection.', 109, '🍗', 0, 0, 7],
  // Burgers
  ['burgers', 'Crispy Veg Aluu Tikki Burger', 'Roasted masala buns, crispy tikki, cheese, sauces.', 89, '🍔', 1, 0, 1],
  ['burgers', 'Crispy Chicken Burger', 'Roasted masala buns, thick crispy chicken fillet.', 109, '🍗', 0, 1, 2],
  // Sandwiches
  ['sandwiches', 'Tangy Mushroom Sandwich', 'Tangy mushroom filling in toasted bread.', 89, '🥪', 1, 0, 1],
  ['sandwiches', 'Vegiii Cheese Sandwich', 'Loaded veggie and cheese in crisp toast.', 89, '🥗', 1, 0, 2],
  ['sandwiches', 'Delicious Paneer Sandwich', 'Spiced paneer filling, toasted golden.', 89, '🧆', 1, 0, 3],
  ['sandwiches', 'Corn and Cheese Sandwich', 'Sweet corn with melted cheese in toasted bread.', 89, '🌽', 1, 0, 4],
  ['sandwiches', 'Egg Sandwich', 'Perfectly cooked egg layers in toast.', 99, '🥚', 1, 0, 5],
  ['sandwiches', 'Chicken Sandwich', 'Juicy chicken in seasoned toasted bread.', 119, '🍗', 0, 0, 6],
  ['sandwiches', 'Egg Chicken Sandwich', 'The ultimate combo — egg + chicken stacked high.', 129, '🥪', 0, 1, 7],
  // Fries
  ['fries', 'Normal Fries', 'Crispy golden fries with ketchup.', 89, '🍟', 1, 0, 1],
  ['fries', 'Special Masala Mix Fries', 'Fries tossed in our secret masala blend.', 99, '🌶️', 1, 0, 2],
  ['fries', 'Peri Peri Fries', 'Smoky peri peri coating on every crispy fry.', 99, '🔥', 1, 1, 3],
  ['fries', 'Cheese Loaded Fries', 'Liquid cheese drizzled over crispy seasoned fries.', 109, '🧀', 1, 1, 4],
  // Egg Specials
  ['egg-specials', 'Single Egg Poch', 'Perfectly poached egg, simple and satisfying.', 40, '🥚', 1, 0, 1],
  ['egg-specials', 'Omlette (3 Egg)', 'Classic fluffy three-egg omelette.', 60, '🍳', 1, 0, 2],
  ['egg-specials', 'Cheese Omlette', 'Melted cheese folded inside a fluffy omelette.', 80, '🧀', 1, 0, 3],
  ['egg-specials', 'Bread Omlette (3 Egg)', 'Egg fused into bread, cooked golden.', 80, '🍞', 1, 0, 4],
  ['egg-specials', 'Cheese Bread Omlette', 'Cheese + bread + omelette. The triple threat.', 100, '🧀', 1, 1, 5],
  // Drinks
  ['drinks', 'Cold Coffee', 'Chilled, creamy cold brew coffee.', 70, '☕', 1, 0, 1],
  ['drinks', 'Lime and Mint', 'Fresh lime and mint — cool and refreshing.', 79, '🍋', 1, 0, 2],
  ['drinks', 'Blue Lagoon', 'Smoky citrus blue drink that looks electric.', 79, '💙', 1, 1, 3],
  // Pasta
  ['pasta', 'Red Sauce Pasta with Paneer', 'Al dente pasta in rich tomato sauce with paneer chunks.', 109, '🍝', 1, 1, 1],
  // Add-Ons
  ['add-ons', 'Cheese Slice', 'Single processed cheese slice.', 19, '🧀', 1, 0, 1],
  ['add-ons', 'Home Made Liquid Cheese', 'Our signature poured liquid cheese.', 19, '🫕', 1, 0, 2],
];

menuSeed.forEach(([slug, name, desc, price, emoji, isVeg, isFeat, sort]) => {
  const cat = getCatId.get(slug);
  if (cat) seedItem.run(cat.id, name, desc, price, emoji, isVeg, isFeat, sort);
});

// ─── SEED SETTINGS ──────────────────────────────────────────
const DEFAULT_WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '918144312236';
const DEFAULT_WHATSAPP_CATALOG_URL = process.env.WHATSAPP_CATALOG_URL || `https://wa.me/c/${DEFAULT_WHATSAPP_NUMBER}`;
const DEFAULT_INSTAGRAM_URL = process.env.INSTAGRAM_URL || 'https://www.instagram.com/eat_a_lot_08/';

const setSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
[
  ['restaurant_name', 'Eat A Lot'],
  ['tagline', 'Born to be Devoured'],
  ['whatsapp', DEFAULT_WHATSAPP_NUMBER],
  ['whatsapp_catalog_url', DEFAULT_WHATSAPP_CATALOG_URL],
  ['instagram', DEFAULT_INSTAGRAM_URL],
  ['is_open', '1'],
  ['open_hours', 'Open 24 Hours'],
  ['address', 'Patna, Bihar'],
].forEach(([k, v]) => setSetting.run(k, v));

db.prepare(`
  UPDATE site_settings
  SET value = ?
  WHERE key = 'whatsapp' AND (value IS NULL OR TRIM(value) = '' OR value = '919XXXXXXXXX')
`).run(DEFAULT_WHATSAPP_NUMBER);

db.prepare(`
  UPDATE site_settings
  SET value = ?
  WHERE key = 'whatsapp_catalog_url' AND (value IS NULL OR TRIM(value) = '')
`).run(DEFAULT_WHATSAPP_CATALOG_URL);

db.prepare(`
  UPDATE site_settings
  SET value = ?
  WHERE key = 'instagram' AND (value IS NULL OR TRIM(value) = '')
`).run(DEFAULT_INSTAGRAM_URL);

console.log('✅ Database initialised');

module.exports = db;
