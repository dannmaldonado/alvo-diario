import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const getAllHistorico = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM historico_pontos WHERE user_id = ? ORDER BY data DESC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getHistoricoByDateRange = async (userId, startDate, endDate) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM historico_pontos WHERE user_id = ? AND data >= ? AND data <= ? ORDER BY data DESC',
      [userId, startDate, endDate]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const createHistorico = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.query(
      'INSERT INTO historico_pontos (id, user_id, data, pontos, motivo) VALUES (?, ?, ?, ?, ?)',
      [id, userId, data.data || new Date().toISOString().split('T')[0], data.pontos, data.motivo]
    );

    const [rows] = await connection.query(
      'SELECT * FROM historico_pontos WHERE id = ?',
      [id]
    );
    return rows[0];
  } finally {
    connection.release();
  }
};

export default {
  getAllHistorico,
  getHistoricoByDateRange,
  createHistorico
};
