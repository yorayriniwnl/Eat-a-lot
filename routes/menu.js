const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

// GET /api/menu — all categories + items
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order').all();
  const items = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY sort_order').all();
  const result = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));
  res.json({ success: true, data: result });
});

// GET /api/menu/featured — homepage featured items
router.get('/featured', (req, res) => {
  const items = db.prepare(`
    SELECT m.*, c.name as category_name, c.emoji as category_emoji
    FROM menu_items m JOIN categories c ON m.category_id = c.id
    WHERE m.is_featured = 1 AND m.available = 1
    ORDER BY m.sort_order
  `).all();
  res.json({ success: true, data: items });
});

// GET /api/menu/category/:slug
router.get('/category/:slug', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const items = db.prepare('SELECT * FROM menu_items WHERE category_id = ? AND available = 1 ORDER BY sort_order').all(cat.id);
  res.json({ success: true, data: { ...cat, items } });
});

// ── ADMIN ONLY ──────────────────────────────────────────────

// POST /api/menu/items — create item
router.post('/items', auth, (req, res) => {
  const { category_id, name, description, price, emoji, is_veg, is_featured, sort_order } = req.body;
  if (!category_id || !name || !price) return res.status(400).json({ error: 'category_id, name and price are required' });
  const r = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, price, emoji, is_veg, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, name, description || '', price, emoji || '🍴', is_veg ?? 1, is_featured ?? 0, sort_order ?? 0);
  res.json({ success: true, id: r.lastInsertRowid });
});

// PUT /api/menu/items/:id — update item
router.put('/items/:id', auth, (req, res) => {
  const { name, description, price, emoji, is_veg, is_featured, available, sort_order } = req.body;
  db.prepare(`
    UPDATE menu_items SET
      name=COALESCE(?,name), description=COALESCE(?,description),
      price=COALESCE(?,price), emoji=COALESCE(?,emoji),
      is_veg=COALESCE(?,is_veg), is_featured=COALESCE(?,is_featured),
      available=COALESCE(?,available), sort_order=COALESCE(?,sort_order),
      updated_at=datetime('now')
    WHERE id=?
  `).run(name, description, price, emoji, is_veg, is_featured, available, sort_order, req.params.id);
  res.json({ success: true });
});

// DELETE /api/menu/items/:id
router.delete('/items/:id', auth, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Toggle availability
router.patch('/items/:id/toggle', auth, (req, res) => {
  db.prepare("UPDATE menu_items SET available = 1 - available, updated_at=datetime('now') WHERE id=?").run(req.params.id);
  const item = db.prepare('SELECT available FROM menu_items WHERE id=?').get(req.params.id);
  res.json({ success: true, available: item.available });
});

module.exports = router;
