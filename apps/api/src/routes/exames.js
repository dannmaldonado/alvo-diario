import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { saveExame, getExameByDate, getExamesRecentes } from '../services/exames.js';

const router = Router();

router.use(authenticate);

// POST /api/exames — salvar exame do dia
router.post('/', async (req, res) => {
  try {
    const exame = await saveExame(req.user.id, req.body);
    res.json(exame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exames/hoje — exame de hoje
router.get('/hoje', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const exame = await getExameByDate(req.user.id, today);
    res.json(exame);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exames — histórico recente
router.get('/', async (req, res) => {
  try {
    const exames = await getExamesRecentes(req.user.id);
    res.json(exames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
