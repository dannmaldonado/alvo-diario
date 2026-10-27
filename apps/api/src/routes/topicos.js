/**
 * Topicos Routes — per-user topic progress with batida (pass) tracking
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '../middleware/auth.js';
import { pool } from '../db/connection.js';

const router = express.Router();

// GET /api/topicos/progresso?edital_id=X&materia=Y
// Returns all topic rows for a matéria (current batida context)
router.get('/progresso', authMiddleware, async (req, res) => {
  const { edital_id, materia } = req.query;
  if (!edital_id || !materia) {
    return res.status(400).json({ error: 'edital_id e materia são obrigatórios.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT topico_nome, batida, concluido_em, questoes_total, questoes_acertos
       FROM topico_progresso
       WHERE user_id = ? AND edital_id = ? AND materia_nome = ?
       ORDER BY batida DESC, topico_nome`,
      [req.user.id, edital_id, materia]
    );

    // Group by topico: return current batida state per topic
    const byTopico = {};
    for (const row of rows) {
      if (!byTopico[row.topico_nome]) {
        byTopico[row.topico_nome] = row; // highest batida first (ORDER BY batida DESC)
      }
    }

    // Compute max batida across all topics for this matéria
    const batidaAtual = rows.length > 0 ? Math.max(...rows.map(r => r.batida)) : 1;

    res.json({
      batida_atual: batidaAtual,
      topicos: Object.values(byTopico),
    });
  } catch (error) {
    console.error('[topicos] GET /progresso', error.message);
    res.status(500).json({ error: 'Erro ao carregar progresso.' });
  }
});

// PATCH /api/topicos/progresso — mark/unmark topic, optionally record questions
// Body: { edital_id, materia_nome, topico_nome, concluido (bool), questoes_total?, questoes_acertos? }
router.patch('/progresso', authMiddleware, async (req, res) => {
  const { edital_id, materia_nome, topico_nome, concluido, questoes_total, questoes_acertos } = req.body;

  if (!edital_id || !materia_nome || !topico_nome) {
    return res.status(400).json({ error: 'edital_id, materia_nome e topico_nome são obrigatórios.' });
  }

  try {
    // Find the current batida for this user/edital/materia/topico
    const [existing] = await pool.query(
      `SELECT id, batida, concluido_em FROM topico_progresso
       WHERE user_id = ? AND edital_id = ? AND materia_nome = ? AND topico_nome = ?
       ORDER BY batida DESC LIMIT 1`,
      [req.user.id, edital_id, materia_nome, topico_nome]
    );

    const now = concluido ? new Date() : null;

    if (existing.length === 0) {
      // First time touching this topic — insert row for batida 1
      await pool.query(
        `INSERT INTO topico_progresso (id, user_id, edital_id, materia_nome, topico_nome, batida, concluido_em, questoes_total, questoes_acertos)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          uuidv4(), req.user.id, edital_id, materia_nome, topico_nome,
          now,
          questoes_total ?? null,
          questoes_acertos ?? null,
        ]
      );
    } else {
      const row = existing[0];
      await pool.query(
        `UPDATE topico_progresso
         SET concluido_em = ?, questoes_total = COALESCE(?, questoes_total), questoes_acertos = COALESCE(?, questoes_acertos)
         WHERE id = ?`,
        [now, questoes_total ?? null, questoes_acertos ?? null, row.id]
      );
    }

    // Check if ALL topics of this matéria (in this edital) are now done in current batida
    // We look at the edital's topic list vs completed rows
    const [editalRow] = await pool.query(
      `SELECT materias FROM editais WHERE id = ? AND user_id = ?`,
      [edital_id, req.user.id]
    );

    if (!editalRow.length) {
      return res.json({ ok: true, nova_batida: false });
    }

    const materias = editalRow[0].materias;
    const editalMateria = materias.find(
      (m) => m.nome.toLowerCase() === materia_nome.toLowerCase()
    );

    if (!editalMateria || !editalMateria.topicos?.length) {
      return res.json({ ok: true, nova_batida: false });
    }

    // Get current batida for this matéria
    const [batidaRows] = await pool.query(
      `SELECT topico_nome, batida, concluido_em FROM topico_progresso
       WHERE user_id = ? AND edital_id = ? AND materia_nome = ?
       ORDER BY batida DESC`,
      [req.user.id, edital_id, materia_nome]
    );

    // Build map: topico_nome → {batida, concluido_em} (highest batida per topic)
    const progressMap = {};
    for (const r of batidaRows) {
      if (!progressMap[r.topico_nome]) progressMap[r.topico_nome] = r;
    }

    const currentBatida = batidaRows.length > 0 ? Math.max(...batidaRows.map(r => r.batida)) : 1;
    const totalTopicos = editalMateria.topicos.length;
    const concluidosNaBatida = editalMateria.topicos.filter((t) => {
      const p = progressMap[t.nome];
      return p && p.batida === currentBatida && p.concluido_em !== null;
    }).length;

    if (concluido && concluidosNaBatida >= totalTopicos) {
      // All done — start new batida by inserting rows with concluido_em = NULL for next batida
      const novaBatida = currentBatida + 1;
      const insertValues = editalMateria.topicos.map((t) => [
        uuidv4(), req.user.id, edital_id, materia_nome, t.nome, novaBatida, null, null, null,
      ]);
      if (insertValues.length > 0) {
        await pool.query(
          `INSERT INTO topico_progresso (id, user_id, edital_id, materia_nome, topico_nome, batida, concluido_em, questoes_total, questoes_acertos)
           VALUES ?`,
          [insertValues]
        );
      }
      return res.json({ ok: true, nova_batida: true, batida: novaBatida });
    }

    res.json({ ok: true, nova_batida: false });
  } catch (error) {
    console.error('[topicos] PATCH /progresso', error.message);
    res.status(500).json({ error: 'Erro ao salvar progresso.' });
  }
});

export default router;
