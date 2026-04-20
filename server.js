const http = require('http');
const app = require('./api');
const DEFAULT_PORT = 3000;
const parsedPort = Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10);
const PORT = Number.isInteger(parsedPort) ? parsedPort : DEFAULT_PORT;
const HAS_EXPLICIT_PORT = Boolean(process.env.PORT);
const MAX_PORT_FALLBACKS = 10;

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
