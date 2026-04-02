import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const saveExame = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    const today = data.data || new Date().toISOString().split('T')[0];

    await connection.query(
      `INSERT INTO exames_diarios (id, user_id, data, respostas, observacoes, pontuacao)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE respostas = VALUES(respostas), observacoes = VALUES(observacoes), pontuacao = VALUES(pontuacao), updated = CURRENT_TIMESTAMP`,
      [id, userId, today, JSON.stringify(data.respostas), data.observacoes || null, data.pontuacao ?? null]
    );

    const [rows] = await connection.query(
      'SELECT * FROM exames_diarios WHERE user_id = ? AND data = ?',
      [userId, today]
    );
    return { ...rows[0], respostas: JSON.parse(rows[0].respostas) };
  } finally {
    connection.release();
  }
};

export const getExameByDate = async (userId, date) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM exames_diarios WHERE user_id = ? AND data = ?',
      [userId, date]
    );
    if (rows.length === 0) return null;
    return { ...rows[0], respostas: JSON.parse(rows[0].respostas) };
  } finally {
    connection.release();
  }
};

export const getExamesRecentes = async (userId, limit = 30) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM exames_diarios WHERE user_id = ? ORDER BY data DESC LIMIT ?',
      [userId, limit]
    );
    return rows.map(r => ({ ...r, respostas: JSON.parse(r.respostas) }));
  } finally {
    connection.release();
  }
};
