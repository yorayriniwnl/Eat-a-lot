const router = require('express').Router();
const db = require('../db/database');

const PUBLIC_SETTING_KEYS = [
  'restaurant_name',
  'tagline',
  'whatsapp',
  'whatsapp_catalog_url',
  'instagram',
  'is_open',
  'open_hours',
  'address',
];

router.get('/', (_req, res) => {
  const placeholders = PUBLIC_SETTING_KEYS.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT key, value
    FROM site_settings
    WHERE key IN (${placeholders})
  `).all(...PUBLIC_SETTING_KEYS);

  const settings = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
  if (!settings.whatsapp_catalog_url && settings.whatsapp) {
    settings.whatsapp_catalog_url = `https://wa.me/c/${settings.whatsapp}`;
  }

  res.json({ success: true, data: settings });
});

module.exports = router;
