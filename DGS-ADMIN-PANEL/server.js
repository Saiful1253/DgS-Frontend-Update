const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Logger helper
function logError(msg, err) {
  try {
    const logPath = path.join(__dirname, 'passenger_err.log');
    const time = new Date().toISOString();
    const errMsg = err ? `${err.message}\n${err.stack}` : '';
    fs.appendFileSync(logPath, `[${time}] ${msg} ${errMsg}\n\n`);
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', reason);
});

// Load .env natively without external packages
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0 && !process.env[key.trim()]) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
} catch (e) {
  logError('Error loading .env', e);
}

const port = process.env.PORT || 3000;
const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on cPanel port ${port}`);
  });
}).catch((err) => {
  logError('Error starting server', err);
  process.exit(1);
});


