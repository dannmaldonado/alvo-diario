/**
 * Missoes Routes — Daily mission management
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { gerarOuBuscarMissoes, concluirMissao, ignorarMissao } from '../services/missoes.js';

const router = express.Router();

// GET /api/missoes — Get (or generate) today's missions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const missoes = await gerarOuBuscarMissoes(req.user.id);
    res.json(missoes);
  } catch (error) {
    console.error('[missoes] Erro ao buscar missões:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/missoes/:id/concluir — Mark mission as completed
router.post('/:id/concluir', authMiddleware, async (req, res) => {
  try {
    const result = await concluirMissao(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/missoes/:id/ignorar — Skip a mission
router.post('/:id/ignorar', authMiddleware, async (req, res) => {
  try {
    const result = await ignorarMissao(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
