import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/connection.js';
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
  app.use(express.static(frontendPath));

  // SPA fallback - all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
