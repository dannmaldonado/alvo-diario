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
      let verticalizacao = null;
      try {
        verticalizacao = row.verticalizacao
          ? (typeof row.verticalizacao === 'string' ? JSON.parse(row.verticalizacao) : row.verticalizacao)
          : null;
      } catch (_) {
        verticalizacao = null;
      }
      return {
        ...row,
        materias,
        verticalizacao,
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
    let verticalizacao = null;
    try {
      verticalizacao = rows[0].verticalizacao
        ? (typeof rows[0].verticalizacao === 'string' ? JSON.parse(rows[0].verticalizacao) : rows[0].verticalizacao)
        : null;
    } catch (_) {
      verticalizacao = null;
    }

    return {
      ...rows[0],
      materias,
      verticalizacao,
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

    let verticalizacaoJson = null;
    if (data.verticalizacao) {
      try {
        verticalizacaoJson = JSON.stringify(data.verticalizacao);
      } catch (_) {
        verticalizacaoJson = null;
      }
    }

    await connection.query(
      'INSERT INTO cronogramas (id, user_id, edital, banca, edital_id, data_alvo, data_inicio, materias, status, verticalizacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, data.edital, data.banca || null, data.edital_id || null, data.data_alvo, data.data_inicio || null, materiasJson, data.status || 'ativo', verticalizacaoJson]
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
      edital_id: data.edital_id !== undefined ? data.edital_id : cronograma.edital_id,
      banca: data.banca !== undefined ? data.banca : cronograma.banca,
      data_alvo: data.data_alvo ?? cronograma.data_alvo,
      data_inicio: data.data_inicio !== undefined ? data.data_inicio : cronograma.data_inicio,
      materias: data.materias ?? cronograma.materias,
      status: data.status ?? cronograma.status,
      verticalizacao: data.verticalizacao !== undefined ? data.verticalizacao : cronograma.verticalizacao,
    };

    let verticalizacaoJson = null;
    if (updates.verticalizacao) {
      try {
        verticalizacaoJson = JSON.stringify(updates.verticalizacao);
      } catch (_) {
        verticalizacaoJson = null;
      }
    }

    await connection.query(
      'UPDATE cronogramas SET edital = ?, edital_id = ?, banca = ?, data_alvo = ?, data_inicio = ?, materias = ?, status = ?, verticalizacao = ? WHERE id = ? AND user_id = ?',
      [updates.edital, updates.edital_id || null, updates.banca, updates.data_alvo, updates.data_inicio, JSON.stringify(updates.materias), updates.status, verticalizacaoJson, id, userId]
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
