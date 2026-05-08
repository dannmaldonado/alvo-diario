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

export default router;
