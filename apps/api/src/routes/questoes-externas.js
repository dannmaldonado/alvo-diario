/**
 * Questões Externas Routes — log questions done on external platforms
 */

import express from 'express';
import { z } from 'zod';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getQuestoesExternas,
  createQuestaoExterna,
  deleteQuestaoExterna,
} from '../services/questoes-externas.js';

const router = express.Router();

const createSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (esperado YYYY-MM-DD)'),
  fonte: z.string().min(1).max(100),
  materia: z.string().min(1).max(200),
  total_questoes: z.number().int().min(1).max(500),
  acertos: z.number().int().min(0).max(500),
}).refine(d => d.acertos <= d.total_questoes, {
  message: 'Acertos não pode ser maior que total de questões',
  path: ['acertos'],
});

// GET /api/questoes-externas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const registros = await getQuestoesExternas(req.user.id);
    res.json(registros);
  } catch (error) {
    console.error('[questoes-externas] GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questoes-externas
router.post('/', authMiddleware, validate(createSchema), async (req, res) => {
  try {
    const registro = await createQuestaoExterna(req.user.id, req.body);
    res.status(201).json(registro);
  } catch (error) {
    console.error('[questoes-externas] POST error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/questoes-externas/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteQuestaoExterna(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
