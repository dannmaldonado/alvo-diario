/**
 * Editais Routes — CRUD + topic progress (gamified checklist)
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getAllEditais,
  getEditalById,
  createEdital,
  updateEdital,
  deleteEdital,
  marcarTopico,
} from '../services/editais.js';

const router = express.Router();

// GET /api/editais — list all for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const editais = await getAllEditais(req.user.id);
    res.json(editais);
  } catch (error) {
    console.error('[editais] GET /', error.message);
    res.status(500).json({ error: 'Erro ao carregar editais.' });
  }
});

// POST /api/editais — create new edital
router.post('/', authMiddleware, async (req, res) => {
  try {
    const edital = await createEdital(req.user.id, req.body);
    res.status(201).json(edital);
  } catch (error) {
    console.error('[editais] POST /', error.message);
    res.status(500).json({ error: 'Erro ao criar edital.' });
  }
});

// GET /api/editais/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const edital = await getEditalById(req.user.id, req.params.id);
    res.json(edital);
  } catch (error) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[editais] GET /:id', error.message);
    res.status(500).json({ error: 'Erro ao carregar edital.' });
  }
});

// PATCH /api/editais/:id — update metadata or materias
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const edital = await updateEdital(req.user.id, req.params.id, req.body);
    res.json(edital);
  } catch (error) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[editais] PATCH /:id', error.message);
    res.status(500).json({ error: 'Erro ao atualizar edital.' });
  }
});

// DELETE /api/editais/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteEdital(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('[editais] DELETE /:id', error.message);
    res.status(500).json({ error: 'Erro ao excluir edital.' });
  }
});

// PATCH /api/editais/:id/topico — toggle topic estudado state
router.patch('/:id/topico', authMiddleware, async (req, res) => {
  const { materia_idx, topico_idx, estudado } = req.body;

  if (typeof materia_idx !== 'number' || typeof topico_idx !== 'number') {
    return res.status(400).json({ error: 'materia_idx e topico_idx são obrigatórios (number).' });
  }

  try {
    const result = await marcarTopico(req.user.id, req.params.id, materia_idx, topico_idx, !!estudado);
    res.json(result);
  } catch (error) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('[editais] PATCH /:id/topico', error.message);
    res.status(500).json({ error: 'Erro ao atualizar tópico.' });
  }
});

export default router;
