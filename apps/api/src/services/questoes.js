/**
 * Questoes Service — CRUD, SM-2 spaced repetition, accuracy analytics
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { gerarQuestoes } from './ai.js';

/**
 * Generate questions via AI and store them in database
 */
export async function gerarEArmazenar(userId, { sessao_id, materia, banca, quantidade = 5, dificuldade = 'media' }) {
  try {
    // Generate questions via Claude API
    const questoes = await gerarQuestoes({ materia, banca, quantidade, dificuldade });

    // Insert into database
    const connection = await pool.getConnection();
    try {
      const stored = [];
      for (const q of questoes) {
        const id = uuidv4();
        await connection.query(
          `INSERT INTO questoes (id, user_id, sessao_id, materia, banca, enunciado, opcoes, resposta_correta, explicacao, dificuldade, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [id, userId, sessao_id || null, materia, banca || null, q.enunciado, JSON.stringify(q.opcoes), q.resposta_correta, q.explicacao, q.dificuldade]
        );
        stored.push({ id, ...q });
      }
      return stored;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[questoes.gerarEArmazenar] Error:', error.message);
    throw error;
  }
}

/**
 * Get questions for a user, optionally filtered by subject
 */
export async function getQuestoes(userId, { materia, limit = 50 } = {}) {
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT * FROM questoes WHERE user_id = ? AND status = "active"';
    const params = [userId];

    if (materia) {
      query += ' AND materia = ?';
      params.push(materia);
    }

    query += ` ORDER BY created DESC LIMIT ${parseInt(limit, 10)}`;
    const [rows] = await connection.query(query, params);

    return rows.map(row => ({
      ...row,
      opcoes: typeof row.opcoes === 'string' ? JSON.parse(row.opcoes) : row.opcoes,
    }));
  } finally {
    connection.release();
  }
}

/**
 * Get questions due for spaced repetition review today
 */
export async function getQuestoesForReview(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT * FROM questoes 
       WHERE user_id = ? AND status = 'active' AND review_count > 0 AND next_review <= CURDATE()
       ORDER BY next_review ASC, review_count DESC`,
      [userId]
    );

    return rows.map(row => ({
      ...row,
      opcoes: typeof row.opcoes === 'string' ? JSON.parse(row.opcoes) : row.opcoes,
    }));
  } finally {
    connection.release();
  }
}

/**
 * Submit a response to a question and update SM-2
 * Returns updated question with new SM-2 values
 */
export async function submitResposta(userId, questaoId, { resposta, tempo_resposta_s }) {
  const connection = await pool.getConnection();
  try {
    // Get the question
    const [[questao]] = await connection.execute(
      'SELECT * FROM questoes WHERE id = ? AND user_id = ?',
      [questaoId, userId]
    );

    if (!questao) {
      throw new Error('Questão não encontrada');
    }

    // Determine if correct
    const correta = resposta === questao.resposta_correta ? 1 : 0;

    // Insert response
    const respostaId = uuidv4();
    await connection.execute(
      `INSERT INTO respostas_questoes (id, user_id, questao_id, resposta, correta, tempo_resposta_s)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [respostaId, userId, questaoId, resposta, correta, tempo_resposta_s || null]
    );

    // Update SM-2 on the question
    const quality = correta === 1 ? 5 : 0; // Simplified: correct = 5, wrong = 0
    const sm2 = updateSM2(questao, quality);

    await connection.execute(
      `UPDATE questoes 
       SET ease_factor = ?, interval_days = ?, next_review = ?, review_count = ?, updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sm2.ease_factor, sm2.interval_days, sm2.next_review, sm2.review_count, questaoId]
    );

    return {
      respostaId,
      questaoId,
      correta: correta === 1,
      sm2,
      explicacao: questao.explicacao,
    };
  } finally {
    connection.release();
  }
}

/**
 * Calculate SM-2 values for next review
 * Simplified version: correct answers get longer intervals, wrong answers reset
 */
function updateSM2(questao, quality) {
  let { ease_factor, interval_days, review_count } = questao;

  if (quality >= 3) {
    // Correct answer - increase interval
    if (review_count === 0) {
      interval_days = 1;
    } else if (review_count === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    // Slightly increase ease factor
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * 0.08);
  } else {
    // Wrong answer - reset interval
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);

  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days: parseInt(interval_days, 10),
    next_review: next_review.toISOString().split('T')[0], // YYYY-MM-DD format
    review_count: review_count + 1,
  };
}

/**
 * Get accuracy (success rate) by subject
 */
export async function getAccuracyByMateria(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT 
         q.materia,
         COUNT(rq.id) as total,
         SUM(rq.correta) as acertos
       FROM questoes q
       LEFT JOIN respostas_questoes rq ON q.id = rq.questao_id
       WHERE q.user_id = ? AND q.status = 'active'
       GROUP BY q.materia
       ORDER BY acertos DESC`,
      [userId]
    );

    return rows.map(row => ({
      materia: row.materia,
      total: row.total || 0,
      acertos: row.acertos || 0,
      taxa: row.total > 0 ? (row.acertos / row.total) : 0,
    }));
  } finally {
    connection.release();
  }
}

/**
 * Mark a question as inactive (user-archived, don't show in reviews)
 */
export async function arquivarQuestao(userId, questaoId) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE questoes SET status = "archived" WHERE id = ? AND user_id = ?',
      [questaoId, userId]
    );
  } finally {
    connection.release();
  }
}

export default {
  gerarEArmazenar,
  getQuestoes,
  getQuestoesForReview,
  submitResposta,
  getAccuracyByMateria,
  arquivarQuestao,
};
