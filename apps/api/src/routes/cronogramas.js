import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAllCronogramas, getCronogramaById, createCronograma, updateCronograma, deleteCronograma } from '../services/cronogramas.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const cronogramas = await getAllCronogramas(req.user.id);
    res.json(cronogramas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cronograma = await getCronogramaById(req.user.id, req.params.id);
    res.json(cronograma);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const cronograma = await createCronograma(req.user.id, req.body);
    res.status(201).json(cronograma);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const cronograma = await updateCronograma(req.user.id, req.params.id, req.body);
    res.json(cronograma);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteCronograma(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
