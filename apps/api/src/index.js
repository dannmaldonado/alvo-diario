import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { pool } from './db/connection.js';
import { runMigrations } from './migrations/index.js';
import authRoutes from './routes/auth.js';
import cronogramasRoutes from './routes/cronogramas.js';
import sessoesRoutes from './routes/sessoes.js';
import metasRoutes from './routes/metas.js';
import badgesRoutes from './routes/badges.js';
import historicoRoutes from './routes/historico.js';
import examesRoutes from './routes/exames.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// ENV LOADING: Try multiple paths to find .env
// Hostinger sets cwd to the app root, but dotenv.config()
// with no args looks at cwd which may differ from file location.
// ============================================================
const envCandidates = [
  path.join(__dirname, '../../../.env'),   // repo root from apps/api/src/
  path.join(__dirname, '../.env'),          // apps/api/.env
  path.join(process.cwd(), '.env'),         // Hostinger app root
];

let envLoaded = false;
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[env] Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  // No .env file found -- rely on system environment variables (Hostinger panel)
  console.log('[env] No .env file found, using system environment variables');
  console.log('[env] Searched paths:', envCandidates.join(', '));
}

const app = express();
const PORT = process.env.PORT || 3001;

// In production when NODE_ENV is unset OR explicitly 'production', serve frontend.
// Only skip frontend serving when explicitly in 'development' mode.
const isProd = process.env.NODE_ENV !== 'development';

console.log(`[config] NODE_ENV=${process.env.NODE_ENV || '(unset)'}, isProd=${isProd}, PORT=${PORT}`);
console.log(`[config] DB_HOST=${process.env.DB_HOST || '(unset)'}, DB_NAME=${process.env.DB_NAME || '(unset)'}`);

// Validate critical env vars
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
  console.error('[WARNING] No DB_HOST or DATABASE_URL set. Database connections will fail.');
}
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET not set. Auth endpoints will fail. Set JWT_SECRET in your .env file.');
}

// Middleware
app.use(express.json());

// CORS: In production (same-origin), use explicit domain.
// `origin: true` with credentials causes browser rejections.
const corsOrigin = isProd
  ? (process.env.FRONTEND_URL || 'https://alvodiario.com.br')
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// ============================================================
// GLOBAL HEADERS: Anti-CDN cache for HTML responses
// Hostinger CDN (LiteSpeed) aggressively caches responses.
// These headers ensure HTML is never cached by CDN or browser.
// ============================================================
app.use((req, res, next) => {
  // Prevent Hostinger CDN from caching non-asset responses
  // Assets get their own cache headers from express.static
  if (!req.path.startsWith('/assets/')) {
    res.set('Surrogate-Control', 'no-store');
    res.set('X-Accel-Expires', '0');
  }
  next();
});

// Health check (before auth, before static)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unset',
    port: PORT,
    dbConfigured: !!(process.env.DB_HOST || process.env.DATABASE_URL)
  });
});

// ============================================================
// RATE LIMITING: Protect auth endpoints from brute-force attacks
// ============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failures against the limit)
  skipSuccessfulRequests: true,
});

// API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/cronogramas', cronogramasRoutes);
app.use('/api/sessoes', sessoesRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/exames', examesRoutes);

// ============================================================
// FRONTEND SERVING
// Serve React SPA from the build output directory.
// Activated when NOT in explicit development mode.
// ============================================================
if (isProd) {
  // Resolve frontend path with fallback options
  const primaryPath = path.join(__dirname, '../../../dist/apps/web');
  const altPaths = [
    path.join(process.cwd(), 'dist/apps/web'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'public'),
  ];

  let frontendPath = primaryPath;

  if (!fs.existsSync(primaryPath)) {
    console.error(`[frontend] Primary path not found: ${primaryPath}`);
    console.error(`[frontend] __dirname: ${__dirname}`);
    console.error(`[frontend] cwd: ${process.cwd()}`);

    for (const alt of altPaths) {
      if (fs.existsSync(alt) && fs.existsSync(path.join(alt, 'index.html'))) {
        frontendPath = alt;
        console.log(`[frontend] Using alternative path: ${alt}`);
        break;
      }
    }
  }

  const indexHtmlPath = path.join(frontendPath, 'index.html');
  const frontendExists = fs.existsSync(indexHtmlPath);

  if (!frontendExists) {
    console.error(`[frontend] FATAL: index.html not found at: ${indexHtmlPath}`);
    console.error(`[frontend] Run 'npm run build' to generate frontend assets.`);
  } else {
    console.log(`[frontend] Serving from: ${frontendPath}`);

    // Serve static files with proper MIME types and caching headers
    app.use(express.static(frontendPath, {
      maxAge: 0,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // Hashed assets (e.g., index-BU7d93Yp.js) can be cached aggressively
        if (filePath.includes('/assets/') && !filePath.endsWith('.html')) {
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // HTML and non-hashed files: never cache
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.set('Pragma', 'no-cache');
          res.set('Expires', '0');
        }

        // Explicit MIME types to override any CDN/proxy interference
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
          res.set('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
          res.set('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.woff2')) {
          res.set('Content-Type', 'font/woff2');
        } else if (filePath.endsWith('.woff')) {
          res.set('Content-Type', 'font/woff');
        } else if (filePath.endsWith('.svg')) {
          res.set('Content-Type', 'image/svg+xml');
        } else if (filePath.endsWith('.png')) {
          res.set('Content-Type', 'image/png');
        } else if (filePath.endsWith('.json')) {
          res.set('Content-Type', 'application/json; charset=utf-8');
        }
      }
    }));

    // SPA fallback: serve index.html for all non-API, non-asset routes
    app.get('*', (req, res, next) => {
      // Skip API routes and health check -- let them fall through to 404 handler
      if (req.path.startsWith('/api/') || req.path === '/health') {
        return next();
      }

      // Aggressive no-cache for HTML to defeat Hostinger CDN
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      res.set('X-Accel-Expires', '0');
      res.set('Content-Type', 'text/html; charset=utf-8');
      // Prevent CDN from treating this as cacheable
      res.set('Vary', 'Accept-Encoding, Cookie');
      res.sendFile(indexHtmlPath);
    });
  }
}

// Handle 404 for API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error on ${req.method} ${req.path}:`, err.message);

  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }

  res.status(err.status || 500).send('Internal server error');
});

// Prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error.message, error.stack);
  // Don't exit -- let the server keep running
});

// Start server FIRST, then run migrations
app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  console.log(`[server] CORS origin: ${corsOrigin}`);

  // Run migrations after server is up (non-blocking)
  runMigrations()
    .then(() => console.log('[migrations] Completed successfully'))
    .catch((err) => console.error('[migrations] Warning:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received: closing');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received: closing');
  process.exit(0);
});
