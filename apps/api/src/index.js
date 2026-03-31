import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/connection.js';
import authRoutes from './routes/auth.js';
import cronogramasRoutes from './routes/cronogramas.js';
import sessoesRoutes from './routes/sessoes.js';
import metasRoutes from './routes/metas.js';
import badgesRoutes from './routes/badges.js';
import historicoRoutes from './routes/historico.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cronogramas', cronogramasRoutes);
app.use('/api/sessoes', sessoesRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/historico', historicoRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
