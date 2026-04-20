const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const auth = require('../middleware/auth');

// POST /api/orders — place an order
router.post('/', (req, res) => {
  const { customer_name, customer_phone, items, note } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  // Validate items against DB
  const menuItems = db.prepare('SELECT * FROM menu_items WHERE id = ? AND available = 1');
  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    const dbItem = menuItems.get(item.id);
    if (!dbItem) return res.status(400).json({ error: `Item id ${item.id} not found or unavailable` });
    const qty = Math.max(1, parseInt(item.qty) || 1);
    total += dbItem.price * qty;
    validatedItems.push({ id: dbItem.id, name: dbItem.name, price: dbItem.price, qty, emoji: dbItem.emoji });
  }

  const ref = 'EAL-' + uuidv4().split('-')[0].toUpperCase();

  db.prepare(`
    INSERT INTO orders (order_ref, customer_name, customer_phone, items_json, total, note, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(ref, customer_name || 'Guest', customer_phone || '', JSON.stringify(validatedItems), total, note || '');

  // Build WhatsApp deeplink message
  const waNumber = db.prepare("SELECT value FROM site_settings WHERE key='whatsapp'").get()?.value || '';
  const msgLines = [
    '🔥 *New Order — Eat A Lot*',
    `📋 Ref: ${ref}`,
    `👤 Name: ${customer_name || 'Guest'}`,
    `📞 Phone: ${customer_phone || 'N/A'}`,
    '',
    '*Items:*',
    ...validatedItems.map(i => `• ${i.emoji} ${i.name} x${i.qty} — ₹${(i.price * i.qty).toFixed(0)}`),
    '',
    `💰 *Total: ₹${total.toFixed(0)}*`,
    note ? `📝 Note: ${note}` : '',
  ].filter(Boolean).join('\n');

  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msgLines)}`;

  res.json({ success: true, order_ref: ref, total, whatsapp_link: waLink });
});

// GET /api/orders — list all (admin)
router.get('/', auth, (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  let q = 'SELECT * FROM orders';
  const params = [];
  if (status) { q += ' WHERE status = ?'; params.push(status); }
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  const orders = db.prepare(q).all(...params);
  const total = db.prepare('SELECT COUNT(*) as n FROM orders' + (status ? ' WHERE status=?' : '')).get(...(status ? [status] : [])).n;
  res.json({ success: true, data: orders.map(o => ({ ...o, items: JSON.parse(o.items_json) })), total });
});

// GET /api/orders/:ref — single order
router.get('/:ref', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(req.params.ref);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, data: { ...order, items: JSON.parse(order.items_json) } });
});

// PATCH /api/orders/:ref/status — update status
router.patch('/:ref/status', auth, (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE order_ref=?").run(status, req.params.ref);
  res.json({ success: true });
});

// GET /api/orders/stats/summary — dashboard stats
router.get('/stats/summary', auth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total_orders: db.prepare('SELECT COUNT(*) as n FROM orders').get().n,
    today_orders: db.prepare("SELECT COUNT(*) as n FROM orders WHERE date(created_at)=?").get(today).n,
    total_revenue: db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status != 'cancelled'").get().s,
    today_revenue: db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE date(created_at)=? AND status != 'cancelled'").get(today).s,
    pending: db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='pending'").get().n,
    confirmed: db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='confirmed'").get().n,
    preparing: db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='preparing'").get().n,
  };
  res.json({ success: true, data: stats });
});

module.exports = router;
