import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const getAllBadges = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM badges WHERE user_id = ? ORDER BY data_obtencao DESC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getBadgeById = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM badges WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Badge not found');
    return rows[0];
  } finally {
    connection.release();
  }
};

export const createBadge = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.query(
      'INSERT INTO badges (id, user_id, tipo_badge, descricao) VALUES (?, ?, ?, ?)',
      [id, userId, data.tipo_badge, data.descricao || null]
    );
    return getBadgeById(userId, id);
  } finally {
    connection.release();
  }
};

export default {
  getAllBadges,
  getBadgeById,
  createBadge
};
