import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAllHistorico, getHistoricoByDateRange, createHistorico } from '../services/historico.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let historico;
    if (startDate && endDate) {
      historico = await getHistoricoByDateRange(req.user.id, startDate, endDate);
    } else {
      historico = await getAllHistorico(req.user.id);
    }

    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = await createHistorico(req.user.id, req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
