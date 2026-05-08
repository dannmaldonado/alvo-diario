/**
 * Questoes Routes — AI question generation + response tracking + SM-2 review queue
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { gerarQuestoesSchema, responderQuestaoSchema } from '../schemas/questao.schema.js';
import {
  gerarEArmazenar,
  getQuestoes,
  getQuestoesForReview,
  getAccuracyByMateria,
  submitResposta,
} from '../services/questoes.js';
import { gerarMapaBanca } from '../services/ai.js';
import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/questoes/gerar — Generate questions via Claude AI + store them
router.post('/gerar', authMiddleware, validate(gerarQuestoesSchema), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'Serviço de IA não configurado. Configure ANTHROPIC_API_KEY.' });
    }
    const questoes = await gerarEArmazenar(req.user.id, req.body);
    res.status(201).json(questoes);
  } catch (error) {
    console.error('[questoes] Erro ao gerar questões:', error.message);
    if (error.message.includes('JSON') || error.message.includes('invalid format')) {
      return res.status(502).json({ error: 'Falha ao processar resposta da IA. Tente novamente.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questoes/revisao — Questions due for spaced repetition review today
router.get('/revisao', authMiddleware, async (req, res) => {
  try {
    const questoes = await getQuestoesForReview(req.user.id);
    res.json(questoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questoes/analytics — Accuracy by subject
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const data = await getAccuracyByMateria(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questoes — List questions (optional filter: ?materia=X&limit=N)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { materia, limit } = req.query;
    const questoes = await getQuestoes(req.user.id, {
      materia: materia || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json(questoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questoes/:id/resposta — Submit a response + update SM-2
router.post('/:id/resposta', authMiddleware, validate(responderQuestaoSchema), async (req, res) => {
  try {
    const result = await submitResposta(req.user.id, req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questoes/mapa-banca?banca=X — AI banca profile (cached per banca)
router.get('/mapa-banca', authMiddleware, async (req, res) => {
  const { banca } = req.query;
  if (!banca || banca === 'Sem preferência') {
    return res.status(400).json({ error: 'Parâmetro "banca" obrigatório.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA não configurado.' });
  }

  try {
    const connection = await pool.getConnection();
    try {
      // Check cache first
      const [[cached]] = await connection.execute(
        'SELECT conteudo FROM mapa_banca_cache WHERE banca = ?',
        [banca]
      );
      if (cached) {
        const data = typeof cached.conteudo === 'string'
          ? JSON.parse(cached.conteudo)
          : cached.conteudo;
        return res.json({ ...data, cached: true });
      }

      // Get user's materias for context
      const [[cronograma]] = await connection.execute(
        `SELECT materias FROM cronogramas WHERE user_id = ? AND status = 'ativo' ORDER BY created DESC LIMIT 1`,
        [req.user.id]
      );
      let materias = [];
      if (cronograma?.materias) {
        const parsed = typeof cronograma.materias === 'string'
          ? JSON.parse(cronograma.materias)
          : cronograma.materias;
        materias = Array.isArray(parsed) ? parsed.map(m => m.nome) : [];
      }

      const mapa = await gerarMapaBanca(banca, materias);

      // Cache result
      await connection.execute(
        `INSERT INTO mapa_banca_cache (id, banca, conteudo) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE conteudo = VALUES(conteudo), updated_at = CURRENT_TIMESTAMP`,
        [uuidv4(), banca, JSON.stringify(mapa)]
      );

      res.json({ ...mapa, cached: false });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[mapa-banca] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
