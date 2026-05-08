/**
 * Questoes Service — CRUD + SM-2 spaced repetition for AI-generated questions
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { gerarQuestoes } from './ai.js';

// ============================================================================
// SM-2 ALGORITHM (simplified)
// quality: 5 = correct (confident), 3 = correct (unsure), 0 = wrong
// ============================================================================
function calcularSM2(questao, quality) {
  let { ease_factor, interval_days, review_count } = questao;

  if (quality >= 3) {
    if (review_count === 0) {
      interval_days = 1;
    } else if (review_count === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    interval_days = 1; // reset on failure
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);

  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    next_review: next_review.toISOString().split('T')[0], // YYYY-MM-DD
    review_count: review_count + 1,
  };
}

// ============================================================================
// GENERATE & STORE
// ============================================================================
export const gerarEArmazenar = async (userId, params) => {
  const { sessao_id, materia, banca, quantidade = 5, dificuldade = 'media' } = params;

  // Call Claude API
  const questoesGeradas = await gerarQuestoes({ materia, banca, quantidade, dificuldade });

  const connection = await pool.getConnection();
  try {
    const questoesSalvas = [];

    for (const q of questoesGeradas) {
      const id = uuidv4();
      await connection.query(
        `INSERT INTO questoes
          (id, user_id, sessao_id, materia, banca, enunciado, opcoes, resposta_correta, explicacao, dificuldade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          sessao_id || null,
          materia,
          banca || null,
          q.enunciado,
          JSON.stringify(q.opcoes),
          q.resposta_correta,
          q.explicacao || null,
          q.dificuldade || dificuldade,
        ]
      );
      questoesSalvas.push({ ...q, id, user_id: userId, sessao_id: sessao_id || null });
    }

    return questoesSalvas;
  } finally {
    connection.release();
  }
};

// ============================================================================
// READ
// ============================================================================
export const getQuestoes = async (userId, { materia, limit = 50 } = {}) => {
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT * FROM questoes WHERE user_id = ? AND status = ?';
    const params = [userId, 'active'];

    if (materia) {
      query += ' AND materia = ?';
      params.push(materia);
    }

    query += ' ORDER BY created DESC LIMIT ?';
    params.push(limit);

    const [rows] = await connection.query(query, params);
    return rows.map(parseQuestao);
  } finally {
    connection.release();
  }
};

export const getQuestoesForReview = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await connection.query(
      `SELECT * FROM questoes
       WHERE user_id = ? AND status = 'active' AND review_count > 0 AND next_review <= ?
       ORDER BY next_review ASC`,
      [userId, today]
    );
    return rows.map(parseQuestao);
  } finally {
    connection.release();
  }
};

export const getAccuracyByMateria = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT
         q.materia,
         COUNT(r.id) AS total,
         SUM(r.correta) AS acertos
       FROM respostas_questoes r
       JOIN questoes q ON q.id = r.questao_id
       WHERE r.user_id = ?
       GROUP BY q.materia
       ORDER BY total DESC`,
      [userId]
    );
    return rows.map(r => ({
      materia: r.materia,
      total: Number(r.total),
      acertos: Number(r.acertos),
      taxa: r.total > 0 ? Number((r.acertos / r.total).toFixed(3)) : 0,
    }));
  } finally {
    connection.release();
  }
};

// ============================================================================
// SUBMIT RESPONSE + UPDATE SM-2
// ============================================================================
export const submitResposta = async (userId, questaoId, { resposta, sessao_id, tempo_resposta_s }) => {
  const connection = await pool.getConnection();
  try {
    // Fetch current questao to check correct answer + SM-2 fields
    const [rows] = await connection.query(
      'SELECT * FROM questoes WHERE id = ? AND user_id = ?',
      [questaoId, userId]
    );
    if (rows.length === 0) throw new Error('Questão não encontrada');

    const questao = parseQuestao(rows[0]);
    const correta = resposta === questao.resposta_correta ? 1 : 0;

    // Insert response record
    const responseId = uuidv4();
    await connection.query(
      `INSERT INTO respostas_questoes (id, user_id, questao_id, sessao_id, resposta, correta, tempo_resposta_s)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [responseId, userId, questaoId, sessao_id || null, resposta, correta, tempo_resposta_s || null]
    );

    // Update SM-2 on the question (quality: 5 if correct, 0 if wrong)
    const quality = correta ? 5 : 0;
    const sm2 = calcularSM2(questao, quality);

    await connection.query(
      `UPDATE questoes
       SET ease_factor = ?, interval_days = ?, next_review = ?, review_count = ?, updated = NOW()
       WHERE id = ?`,
      [sm2.ease_factor, sm2.interval_days, sm2.next_review, sm2.review_count, questaoId]
    );

    return {
      id: responseId,
      questao_id: questaoId,
      resposta,
      correta: Boolean(correta),
      resposta_correta: questao.resposta_correta,
      explicacao: questao.explicacao,
      next_review: sm2.next_review,
    };
  } finally {
    connection.release();
  }
};

// ============================================================================
// HELPERS
// ============================================================================
function parseQuestao(row) {
  return {
    ...row,
    opcoes: typeof row.opcoes === 'string' ? JSON.parse(row.opcoes) : row.opcoes,
    review_count: Number(row.review_count),
    ease_factor: Number(row.ease_factor),
    interval_days: Number(row.interval_days),
    resposta_correta: Number(row.resposta_correta),
  };
}
