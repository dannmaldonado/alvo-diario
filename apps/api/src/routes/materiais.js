import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMaterialSchema, updateMaterialSchema } from '../schemas/material.schema.js';
import { getMateriais, getMaterialById, createMaterial, updateMaterial, deleteMaterial } from '../services/materiais.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const materiais = await getMateriais(req.user.id);
    res.json(materiais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const material = await getMaterialById(req.user.id, req.params.id);
    res.json(material);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', authMiddleware, validate(createMaterialSchema), async (req, res) => {
  try {
    const material = await createMaterial(req.user.id, req.body);
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', authMiddleware, validate(updateMaterialSchema), async (req, res) => {
  try {
    const material = await updateMaterial(req.user.id, req.params.id, req.body);
    res.json(material);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteMaterial(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
