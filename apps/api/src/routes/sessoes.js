import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAllSessoes, getSessaoById, getSessoesByDate, getSessoesByDateRange, createSessao, updateSessao, deleteSessao } from '../services/sessoes.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, data } = req.query;

    let sessoes;
    if (startDate && endDate) {
      sessoes = await getSessoesByDateRange(req.user.id, startDate, endDate);
    } else if (data) {
      sessoes = await getSessoesByDate(req.user.id, data);
    } else {
      sessoes = await getAllSessoes(req.user.id);
    }

    res.json(sessoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sessao = await getSessaoById(req.user.id, req.params.id);
    res.json(sessao);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const sessao = await createSessao(req.user.id, req.body);
    res.status(201).json(sessao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const sessao = await updateSessao(req.user.id, req.params.id, req.body);
    res.json(sessao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteSessao(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
