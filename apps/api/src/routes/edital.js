/**
 * Edital Routes — PDF upload + subject extraction via Claude AI
 */

import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth.js';
import { parseEdital, verticalizarEdital } from '../services/ai.js';

const router = express.Router();

// Multer: memory storage (no disk writes), max 10MB, PDF only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são aceitos.'));
    }
  },
});

// POST /api/edital/parse — Upload PDF edital, extract subjects via Claude
router.post('/parse', authMiddleware, upload.single('edital'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado.' });
  }

  try {
    const resultado = await parseEdital(req.file.buffer);

    if (!resultado.materias || resultado.materias.length === 0) {
      return res.status(422).json({
        error: 'Não foi possível extrair matérias do edital. Verifique se o PDF contém o conteúdo programático.',
        resultado,
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error('[edital] Erro ao processar PDF:', error.message);

    // Anthropic API: prompt is too long (PDF too large / too many pages)
    if (
      error.message.includes('too long') ||
      error.message.includes('tokens') ||
      error.message.includes('maximum') ||
      error.status === 400
    ) {
      return res.status(413).json({
        error:
          'O edital é grande demais para análise automática. Tente um PDF com menos páginas (recomendado: até 50 páginas) ou use somente o capítulo de conteúdo programático.',
      });
    }

    if (error.message.includes('JSON') || error.message.includes('invalid format')) {
      return res.status(502).json({ error: 'Falha ao processar resposta da IA. Tente novamente.' });
    }
    res.status(500).json({ error: 'Erro ao processar o edital. Tente novamente.' });
  }
});

// POST /api/edital/verticalizar — Rank edital subjects by historical banca incidence via AI
router.post('/verticalizar', authMiddleware, async (req, res) => {
  const { banca, concurso, materias } = req.body;

  if (!materias || !Array.isArray(materias) || materias.length === 0) {
    return res.status(400).json({ error: 'Matérias são obrigatórias para verticalizar o edital.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado.' });
  }

  try {
    const resultado = await verticalizarEdital({ banca, concurso, materias });
    res.json(resultado);
  } catch (error) {
    console.error('[edital] Erro ao verticalizar:', error.message);

    if (
      error.message.includes('too long') ||
      error.message.includes('tokens') ||
      error.message.includes('maximum')
    ) {
      return res.status(413).json({
        error: 'O edital é muito extenso para verticalização automática. Tente com menos matérias.',
      });
    }

    res.status(500).json({ error: 'Erro ao gerar edital verticalizado. Tente novamente.' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes('PDF')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
