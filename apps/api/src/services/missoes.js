/**
 * Missoes Service — Daily mission generation based on study gaps + accuracy data
 * Rule-based: no AI cost, uses existing session/accuracy data.
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const TIPOS = {
  STUDY: 'study',
  REVIEW: 'review',
  ACCURACY: 'accuracy',
  STREAK: 'streak',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// READ
// ============================================================================

export async function getMissoesDoDia(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM missoes WHERE user_id = ? AND expires_at = ? ORDER BY created_at ASC`,
      [userId, today()]
    );
    return rows;
  } finally {
    connection.release();
  }
}

// ============================================================================
// GENERATE
// ============================================================================

/**
 * Returns today's missions (generates them if this is the first call today).
 * Gathers data from DB directly — no params needed from caller.
 */
export async function gerarOuBuscarMissoes(userId) {
  const todayDate = today();
  const connection = await pool.getConnection();

  try {
    // 1. Check if already generated today
    const [[{ count }]] = await connection.execute(
      'SELECT COUNT(*) as count FROM missoes WHERE user_id = ? AND expires_at = ?',
      [userId, todayDate]
    );
    if (count > 0) {
      const [rows] = await connection.execute(
        'SELECT * FROM missoes WHERE user_id = ? AND expires_at = ? ORDER BY created_at ASC',
        [userId, todayDate]
      );
      return rows;
    }

    // 2. Gather data for mission generation
    // Today's scheduled subject (most recent active cronograma + materias JSON)
    const [[cronograma]] = await connection.execute(
      `SELECT materias, banca FROM cronogramas WHERE user_id = ? AND status = 'ativo' ORDER BY created DESC LIMIT 1`,
      [userId]
    );

    // Accuracy per subject (at least 3 responses to be meaningful)
    const [accuracyRows] = await connection.execute(
      `SELECT q.materia,
              COUNT(rq.id) AS total,
              SUM(rq.correta) AS acertos
       FROM respostas_questoes rq
       JOIN questoes q ON rq.questao_id = q.id
       WHERE rq.user_id = ?
       GROUP BY q.materia
       HAVING total >= 3`,
      [userId]
    );

    // Pending review count
    const [[{ revisao_count }]] = await connection.execute(
      `SELECT COUNT(*) AS revisao_count FROM questoes
       WHERE user_id = ? AND next_review <= ? AND review_count > 0 AND status = 'active'`,
      [userId, todayDate]
    );

    // Last study session date
    const [[lastSessao]] = await connection.execute(
      `SELECT MAX(data_sessao) AS ultima FROM sessoes_estudo WHERE user_id = ?`,
      [userId]
    );
    const ultimaSessao = lastSessao?.ultima;
    const diasSemEstudo = ultimaSessao
      ? Math.floor((Date.now() - new Date(ultimaSessao).getTime()) / 86400000)
      : 999;

    // 3. Build mission list
    const missoes = [];

    // Mission: study today's subject from cronograma
    let todayMateriaName = null;
    if (cronograma?.materias) {
      try {
        const materias = typeof cronograma.materias === 'string'
          ? JSON.parse(cronograma.materias)
          : cronograma.materias;
        if (Array.isArray(materias) && materias.length > 0) {
          // Pick the first non-completed subject
          const pendente = materias.find(m => m.status !== 'concluida') || materias[0];
          todayMateriaName = pendente.nome;
        }
      } catch { /* ignore parse error */ }
    }

    if (todayMateriaName) {
      missoes.push({
        tipo: TIPOS.STUDY,
        titulo: `Estudar ${todayMateriaName}`,
        descricao: `Complete uma sessão Pomodoro de 25 min em ${todayMateriaName} conforme seu cronograma.`,
        materia: todayMateriaName,
        meta_minutos: 25,
        meta_questoes: null,
      });
    } else {
      missoes.push({
        tipo: TIPOS.STUDY,
        titulo: 'Completar uma sessão de estudo',
        descricao: 'Estude pelo menos 25 minutos hoje para manter sua rotina.',
        materia: null,
        meta_minutos: 25,
        meta_questoes: null,
      });
    }

    // Mission: review pending questions
    if (revisao_count >= 3) {
      const qtd = Math.min(revisao_count, 10);
      missoes.push({
        tipo: TIPOS.REVIEW,
        titulo: `Revisar ${qtd} questão${qtd > 1 ? 'ões' : ''}`,
        descricao: `Você tem ${revisao_count} questão${revisao_count > 1 ? 'ões' : ''} para revisar hoje. Acesse a fila de revisão.`,
        materia: null,
        meta_minutos: null,
        meta_questoes: qtd,
      });
    }

    // Mission: improve weak subject accuracy
    const weakSubject = accuracyRows
      .map(r => ({ materia: r.materia, total: Number(r.total), taxa: Number(r.acertos) / Number(r.total) }))
      .find(r => r.taxa < 0.5);

    if (weakSubject) {
      const pct = Math.round(weakSubject.taxa * 100);
      missoes.push({
        tipo: TIPOS.ACCURACY,
        titulo: `Fortalecer ${weakSubject.materia}`,
        descricao: `Sua taxa em ${weakSubject.materia} está em ${pct}%. Revise o conteúdo e responda questões para melhorar.`,
        materia: weakSubject.materia,
        meta_minutos: null,
        meta_questoes: null,
      });
    }

    // Mission: streak (hasn't studied yesterday or before)
    if (diasSemEstudo >= 1) {
      missoes.push({
        tipo: TIPOS.STREAK,
        titulo: diasSemEstudo >= 2 ? 'Retomar sequência de estudos' : 'Manter sequência de estudos',
        descricao: diasSemEstudo >= 2
          ? `Faz ${diasSemEstudo} dia${diasSemEstudo > 1 ? 's' : ''} sem estudar. Volte hoje para não perder o ritmo!`
          : 'Estude pelo menos 25 minutos hoje para manter sua sequência.',
        materia: null,
        meta_minutos: 25,
        meta_questoes: null,
      });
    }

    // 4. Insert all missions
    for (const m of missoes) {
      await connection.execute(
        `INSERT INTO missoes (id, user_id, tipo, titulo, descricao, materia, meta_minutos, meta_questoes, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, m.tipo, m.titulo, m.descricao, m.materia, m.meta_minutos, m.meta_questoes, todayDate]
      );
    }

    const [rows] = await connection.execute(
      'SELECT * FROM missoes WHERE user_id = ? AND expires_at = ? ORDER BY created_at ASC',
      [userId, todayDate]
    );
    return rows;
  } finally {
    connection.release();
  }
}

// ============================================================================
// COMPLETE / SKIP
// ============================================================================

export async function concluirMissao(userId, missaoId) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `UPDATE missoes SET status = 'concluida' WHERE id = ? AND user_id = ? AND expires_at = ?`,
      [missaoId, userId, today()]
    );
    if (result.affectedRows === 0) {
      throw new Error('Missão não encontrada ou já expirada.');
    }
    return { success: true };
  } finally {
    connection.release();
  }
}

export async function ignorarMissao(userId, missaoId) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `UPDATE missoes SET status = 'ignorada' WHERE id = ? AND user_id = ?`,
      [missaoId, userId]
    );
    return { success: true };
  } finally {
    connection.release();
  }
}
