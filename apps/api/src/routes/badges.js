import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAllBadges, getBadgeById, createBadge } from '../services/badges.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const badges = await getAllBadges(req.user.id);
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const badge = await getBadgeById(req.user.id, req.params.id);
    res.json(badge);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const badge = await createBadge(req.user.id, req.body);
    res.status(201).json(badge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
