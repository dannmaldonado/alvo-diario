import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const getAllCronogramas = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM cronogramas WHERE user_id = ? ORDER BY created DESC',
      [userId]
    );
    return rows.map(row => {
      let materias = [];
      try {
        materias = row.materias ? JSON.parse(row.materias) : [];
      } catch (parseError) {
        console.error(`[cronogramas] Erro ao fazer parse de materias para cronograma ${row.id}:`, parseError.message);
        console.error(`[cronogramas] Raw materias value: ${row.materias}`);
        // Return empty array instead of crashing — user can re-edit
        materias = [];
      }
      return {
        ...row,
        materias
      };
    });
  } finally {
    connection.release();
  }
};

export const getCronogramaById = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM cronogramas WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Cronograma not found');

    let materias = [];
    try {
      materias = rows[0].materias ? JSON.parse(rows[0].materias) : [];
    } catch (parseError) {
      console.error(`[cronogramas] Erro ao fazer parse de materias para cronograma ${id}:`, parseError.message);
      console.error(`[cronogramas] Raw materias value: ${rows[0].materias}`);
      // Return empty array instead of crashing — user can re-edit
      materias = [];
    }

    return {
      ...rows[0],
      materias
    };
  } finally {
    connection.release();
  }
};

export const createCronograma = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();

    // Validate materias is serializable
    let materiasJson;
    try {
      materiasJson = JSON.stringify(data.materias || []);
    } catch (error) {
      throw new Error(`Materias JSON inválido: ${error.message}`);
    }

    await connection.query(
      'INSERT INTO cronogramas (id, user_id, edital, banca, data_alvo, data_inicio, materias, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, data.edital, data.banca || null, data.data_alvo, data.data_inicio || null, materiasJson, data.status || 'ativo']
    );
    return getCronogramaById(userId, id);
  } finally {
    connection.release();
  }
};

export const updateCronograma = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    const cronograma = await getCronogramaById(userId, id);

    const updates = {
      edital: data.edital ?? cronograma.edital,
      banca: data.banca !== undefined ? data.banca : cronograma.banca,
      data_alvo: data.data_alvo ?? cronograma.data_alvo,
      data_inicio: data.data_inicio !== undefined ? data.data_inicio : cronograma.data_inicio,
      materias: data.materias ?? cronograma.materias,
      status: data.status ?? cronograma.status
    };

    await connection.query(
      'UPDATE cronogramas SET edital = ?, banca = ?, data_alvo = ?, data_inicio = ?, materias = ?, status = ? WHERE id = ? AND user_id = ?',
      [updates.edital, updates.banca, updates.data_alvo, updates.data_inicio, JSON.stringify(updates.materias), updates.status, id, userId]
    );

    return getCronogramaById(userId, id);
  } finally {
    connection.release();
  }
};

export const deleteCronograma = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'DELETE FROM cronogramas WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  } finally {
    connection.release();
  }
};

export default {
  getAllCronogramas,
  getCronogramaById,
  createCronograma,
  updateCronograma,
  deleteCronograma
};
