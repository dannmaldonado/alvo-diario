import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMetaSchema, updateMetaSchema } from '../schemas/meta.schema.js';
import { getAllMetas, getMetaById, getMetaByDate, createMeta, updateMeta, deleteMeta } from '../services/metas.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const metas = await getAllMetas(req.user.id);
    res.json(metas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-date/:data', authMiddleware, async (req, res) => {
  try {
    const meta = await getMetaByDate(req.user.id, req.params.data);
    res.json(meta || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const meta = await getMetaById(req.user.id, req.params.id);
    res.json(meta);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authMiddleware, validate(createMetaSchema), async (req, res) => {
  try {
    const meta = await createMeta(req.user.id, req.body);
    res.status(201).json(meta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authMiddleware, validate(updateMetaSchema), async (req, res) => {
  try {
    const meta = await updateMeta(req.user.id, req.params.id, req.body);
    res.json(meta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteMeta(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
