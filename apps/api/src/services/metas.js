import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const getAllMetas = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM metas_diarias WHERE user_id = ? ORDER BY data DESC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getMetaById = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM metas_diarias WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Meta not found');
    return rows[0];
  } finally {
    connection.release();
  }
};

export const getMetaByDate = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM metas_diarias WHERE user_id = ? AND data = ?',
      [userId, data]
    );
    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
};

export const createMeta = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.query(
      'INSERT INTO metas_diarias (id, user_id, data, horas_meta, status) VALUES (?, ?, ?, ?, ?)',
      [id, userId, data.data, data.horas_meta, data.status || 'nao_iniciada']
    );
    return getMetaById(userId, id);
  } finally {
    connection.release();
  }
};

export const updateMeta = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    const fields = [];
    const values = [];
    const allowedFields = ['horas_meta', 'horas_realizadas', 'status', 'avaliacao_diaria'];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) throw new Error('No valid fields to update');

    values.push(id);
    values.push(userId);

    await connection.query(
      `UPDATE metas_diarias SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return getMetaById(userId, id);
  } finally {
    connection.release();
  }
};

export const deleteMeta = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'DELETE FROM metas_diarias WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  } finally {
    connection.release();
  }
};

export default {
  getAllMetas,
  getMetaById,
  getMetaByDate,
  createMeta,
  updateMeta,
  deleteMeta
};
