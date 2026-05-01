import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const getMateriais = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM materiais WHERE user_id = ? AND ativo = 1 ORDER BY nome ASC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getMaterialById = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM materiais WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Material não encontrado');
    return rows[0];
  } finally {
    connection.release();
  }
};

export const createMaterial = async (userId, data) => {
  const id = uuidv4();
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'INSERT INTO materiais (id, user_id, nome, tipo, descricao) VALUES (?, ?, ?, ?, ?)',
      [id, userId, data.nome, data.tipo || 'outro', data.descricao || null]
    );
  } finally {
    connection.release();
  }
  return getMaterialById(userId, id);
};

export const updateMaterial = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    const fields = [];
    const values = [];
    const allowedFields = ['nome', 'tipo', 'descricao', 'ativo'];

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
      `UPDATE materiais SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return getMaterialById(userId, id);
  } finally {
    connection.release();
  }
};

export const deleteMaterial = async (userId, id) => {
  // Soft-delete: set ativo = 0
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE materiais SET ativo = 0 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return { success: true };
  } finally {
    connection.release();
  }
};
