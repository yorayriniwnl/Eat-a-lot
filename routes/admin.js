const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const auth = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  // Check env-based admin first (bootstrapping)
  const envUser = process.env.ADMIN_USERNAME || 'admin';
  const envPass = process.env.ADMIN_PASSWORD || 'admin';

  if (username === envUser && password === envPass) {
    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '12h' });
    return res.json({ success: true, token });
  }

  // DB admins
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, role: 'admin', id: admin.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '12h' });
  res.json({ success: true, token });
});

// GET /api/admin/me — verify token
router.get('/me', auth, (req, res) => res.json({ success: true, admin: req.admin }));

// GET /api/admin/settings
router.get('/settings', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM site_settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({ success: true, data: settings });
});

// PUT /api/admin/settings
router.put('/settings', auth, (req, res) => {
  const upsert = db.prepare('INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const run = db.transaction(entries => entries.forEach(([k, v]) => upsert.run(k, String(v))));
  run(Object.entries(req.body));
  res.json({ success: true });
});

// GET /api/admin/categories
router.get('/categories', auth, (req, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM categories ORDER BY sort_order').all() });
});

// POST /api/admin/categories
router.post('/categories', auth, (req, res) => {
  const { name, emoji, slug, sort_order } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
  const r = db.prepare('INSERT INTO categories (name, emoji, slug, sort_order) VALUES (?,?,?,?)').run(name, emoji || '🍴', slug, sort_order || 0);
  res.json({ success: true, id: r.lastInsertRowid });
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', auth, (req, res) => {
  const { name, emoji, active, sort_order } = req.body;
  db.prepare('UPDATE categories SET name=COALESCE(?,name), emoji=COALESCE(?,emoji), active=COALESCE(?,active), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(name, emoji, active, sort_order, req.params.id);
  res.json({ success: true });
});

module.exports = router;
