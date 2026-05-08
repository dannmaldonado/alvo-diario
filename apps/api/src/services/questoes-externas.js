/**
 * Questões Externas Service — tracking questions done on external platforms
 */

import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function getQuestoesExternas(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, data, fonte, materia, total_questoes, acertos,
            (total_questoes - acertos) AS erros, created
     FROM questoes_externas
     WHERE user_id = ?
     ORDER BY data DESC, created DESC`,
    [userId]
  );
  return rows;
}

export async function createQuestaoExterna(userId, { data, fonte, materia, total_questoes, acertos }) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO questoes_externas (id, user_id, data, fonte, materia, total_questoes, acertos)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data, fonte, materia, total_questoes, acertos]
  );
  return { id, user_id: userId, data, fonte, materia, total_questoes, acertos,
           erros: total_questoes - acertos };
}

export async function deleteQuestaoExterna(userId, id) {
  const [result] = await pool.query(
    'DELETE FROM questoes_externas WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  if (result.affectedRows === 0) throw new Error('Registro não encontrado.');
}
