require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');

const app = express();
const DEFAULT_PORT = 3000;
const parsedPort = Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10);
const PORT = Number.isInteger(parsedPort) ? parsedPort : DEFAULT_PORT;
const HAS_EXPLICIT_PORT = Boolean(process.env.PORT);
const MAX_PORT_FALLBACKS = 10;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many orders, slow down.' } });
app.use('/api/', limiter);
app.use('/api/orders', orderLimiter);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

function logStartup(port) {
  console.log(`\nEat A Lot server running at http://localhost:${port}`);
  console.log(`Admin panel at http://localhost:${port}/admin`);
  console.log(`Default login - ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin'}\n`);
}

function startServer(port, fallbacksRemaining = MAX_PORT_FALLBACKS) {
  const server = http.createServer(app);

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && !HAS_EXPLICIT_PORT && fallbacksRemaining > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use, trying ${nextPort}...`);
      startServer(nextPort, fallbacksRemaining - 1);
      return;
    }

    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Set PORT to a free port and restart.`);
      process.exit(1);
    }

    console.error(err);
    process.exit(1);
  });

  server.once('listening', () => logStartup(port));
  server.listen(port);
}

startServer(PORT);
