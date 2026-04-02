import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/connection.js';
import { runMigrations } from './migrations/index.js';
import authRoutes from './routes/auth.js';
import cronogramasRoutes from './routes/cronogramas.js';
import sessoesRoutes from './routes/sessoes.js';
import metasRoutes from './routes/metas.js';
import badgesRoutes from './routes/badges.js';
import historicoRoutes from './routes/historico.js';
import examesRoutes from './routes/exames.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());
app.use(cors({
  origin: isProd ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cronogramas', cronogramasRoutes);
app.use('/api/sessoes', sessoesRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/exames', examesRoutes);

// Serve React frontend in production
if (isProd) {
  const frontendPath = path.join(__dirname, '../../../dist/apps/web');

  // Serve static files with proper MIME types and caching headers
  app.use(express.static(frontendPath, {
    maxAge: '1d', // Cache static assets for 1 day
    etag: false,
    setHeaders: (res, path, stat) => {
      // Cache assets (with hash in filename) for longer
      if (path.includes('/assets/')) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Don't cache HTML, CSS, JS entry points
        res.set('Cache-Control', 'public, max-age=0, must-revalidate');
      }

      // Set correct MIME types
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript; charset=utf-8');
      } else if (path.endsWith('.css')) {
        res.set('Content-Type', 'text/css; charset=utf-8');
      } else if (path.endsWith('.woff2')) {
        res.set('Content-Type', 'font/woff2');
      } else if (path.endsWith('.woff')) {
        res.set('Content-Type', 'font/woff');
      }
    }
  }));

  // SPA fallback - all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Handle 404 for API routes (assets should be handled by express.static above)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found'
    });
  }
  // For non-API routes, this shouldn't be reached (SPA fallback handles it)
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);

  // Avoid sending error details for static asset requests
  if (req.path.includes('/assets/')) {
    return res.status(err.status || 500).send('Internal server error');
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Start server FIRST, then run migrations
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);

  // Run migrations after server is up
  runMigrations()
    .then(() => console.log('Migrations completed'))
    .catch((err) => console.error('Migration warning:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
