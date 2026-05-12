/**
 * Editais Service — CRUD + topic progress tracking
 * Editais are first-class entities (independent of cronogramas).
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

function parseMaterias(row) {
  let materias = [];
  try {
    materias = row.materias
      ? (typeof row.materias === 'string' ? JSON.parse(row.materias) : row.materias)
      : [];
  } catch (_) {
    materias = [];
  }
  return { ...row, materias };
}

export async function getAllEditais(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM editais WHERE user_id = ? AND status != "excluido" ORDER BY created DESC',
      [userId]
    );
    return rows.map(parseMaterias);
  } finally {
    connection.release();
  }
}

export async function getEditalById(userId, id) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM editais WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Edital não encontrado');
    return parseMaterias(rows[0]);
  } finally {
    connection.release();
  }
}

export async function createEdital(userId, data) {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.query(
      `INSERT INTO editais (id, user_id, titulo, banca, cargo, concurso, total_questoes, materias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.titulo || 'Edital sem título',
        data.banca || null,
        data.cargo || null,
        data.concurso || null,
        data.total_questoes || null,
        JSON.stringify(data.materias || []),
      ]
    );
    return getEditalById(userId, id);
  } finally {
    connection.release();
  }
}

export async function updateEdital(userId, id, data) {
  const connection = await pool.getConnection();
  try {
    const edital = await getEditalById(userId, id);

    const updates = {
      titulo: data.titulo ?? edital.titulo,
      banca: data.banca !== undefined ? data.banca : edital.banca,
      cargo: data.cargo !== undefined ? data.cargo : edital.cargo,
      concurso: data.concurso !== undefined ? data.concurso : edital.concurso,
      total_questoes: data.total_questoes !== undefined ? data.total_questoes : edital.total_questoes,
      materias: data.materias ?? edital.materias,
      status: data.status ?? edital.status,
    };

    await connection.query(
      `UPDATE editais
       SET titulo=?, banca=?, cargo=?, concurso=?, total_questoes=?, materias=?, status=?, updated=CURRENT_TIMESTAMP
       WHERE id=? AND user_id=?`,
      [
        updates.titulo,
        updates.banca,
        updates.cargo,
        updates.concurso,
        updates.total_questoes,
        JSON.stringify(updates.materias),
        updates.status,
        id,
        userId,
      ]
    );

    return getEditalById(userId, id);
  } finally {
    connection.release();
  }
}

export async function deleteEdital(userId, id) {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM editais WHERE id=? AND user_id=?', [id, userId]);
  } finally {
    connection.release();
  }
}

/**
 * Toggle a topic's estudado state (checked/unchecked in the gamified checklist)
 * Updates only the specific topic inside the materias JSON — no full overwrite needed.
 */
export async function marcarTopico(userId, id, materiaIdx, topicoIdx, estudado) {
  const connection = await pool.getConnection();
  try {
    const edital = await getEditalById(userId, id);

    if (!edital.materias[materiaIdx]) {
      throw new Error('Matéria não encontrada');
    }
    if (!edital.materias[materiaIdx].topicos || !edital.materias[materiaIdx].topicos[topicoIdx]) {
      throw new Error('Tópico não encontrado');
    }

    edital.materias[materiaIdx].topicos[topicoIdx].estudado = estudado;

    await connection.query(
      'UPDATE editais SET materias=?, updated=CURRENT_TIMESTAMP WHERE id=? AND user_id=?',
      [JSON.stringify(edital.materias), id, userId]
    );

    // Return summary for optimistic update
    return {
      materia_idx: materiaIdx,
      topico_idx: topicoIdx,
      estudado,
    };
  } finally {
    connection.release();
  }
}

export default {
  getAllEditais,
  getEditalById,
  createEdital,
  updateEdital,
  deleteEdital,
  marcarTopico,
};
