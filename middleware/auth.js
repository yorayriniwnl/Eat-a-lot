const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const production = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET || (production ? '' : 'dev_secret');
  if (!jwtSecret) {
    return res.status(503).json({ error: 'Admin authentication is not configured for this deployment.' });
  }

  const token = auth.slice(7);
  try {
    req.admin = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
};
