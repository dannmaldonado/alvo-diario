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
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

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

// POST /api/editais/import — create or replace an edital from parsed CSV/XLS JSON
// Body: { titulo, banca?, cargo?, concurso?, materias: [{nome, questoes?, prioridade?, topicos:[{nome,ordem,questoes_prova?,horas_sugeridas?}]}] }
router.post('/import', authMiddleware, async (req, res) => {
  const { titulo, banca, cargo, concurso, materias } = req.body;

  if (!titulo || !Array.isArray(materias) || materias.length === 0) {
    return res.status(400).json({ error: 'titulo e materias[] são obrigatórios.' });
  }

  try {
    // Check if user already has an edital with the same titulo — replace it
    const [existing] = await pool.query(
      `SELECT id FROM editais WHERE user_id = ? AND titulo = ? LIMIT 1`,
      [req.user.id, titulo]
    );

    if (existing.length > 0) {
      const editalId = existing[0].id;
      await pool.query(
        `UPDATE editais SET banca=?, cargo=?, concurso=?, materias=?, updated=NOW()
         WHERE id = ? AND user_id = ?`,
        [banca ?? null, cargo ?? null, concurso ?? null, JSON.stringify(materias), editalId, req.user.id]
      );
      const [updated] = await pool.query(`SELECT * FROM editais WHERE id = ?`, [editalId]);
      return res.json({ ...updated[0], materias: JSON.parse(updated[0].materias ?? '[]') });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO editais (id, user_id, titulo, banca, cargo, concurso, materias, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')`,
      [id, req.user.id, titulo, banca ?? null, cargo ?? null, concurso ?? null, JSON.stringify(materias)]
    );
    const [created] = await pool.query(`SELECT * FROM editais WHERE id = ?`, [id]);
    res.status(201).json({ ...created[0], materias: JSON.parse(created[0].materias ?? '[]') });
  } catch (error) {
    console.error('[editais] POST /import', error.message);
    res.status(500).json({ error: 'Erro ao importar edital.' });
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
