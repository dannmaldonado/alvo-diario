import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { calcularPontosSessionao, adicionarPontos, atualizarStreak } from './pontos.js';

export const getAllSessoes = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM sessoes_estudo WHERE user_id = ? ORDER BY data_sessao DESC',
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getSessaoById = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM sessoes_estudo WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Sessão not found');
    return rows[0];
  } finally {
    connection.release();
  }
};

export const getSessoesByDate = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ? ORDER BY created DESC',
      [userId, data]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const getSessoesByDateRange = async (userId, startDate, endDate) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM sessoes_estudo WHERE user_id = ? AND data_sessao >= ? AND data_sessao <= ? ORDER BY data_sessao DESC',
      [userId, startDate, endDate]
    );
    return rows;
  } finally {
    connection.release();
  }
};

export const createSessao = async (userId, data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();

    // Calcular pontos ganhos
    const pontosGanhos = calcularPontosSessionao(data.duracao_minutos);

    await connection.query(
      'INSERT INTO sessoes_estudo (id, user_id, cronograma_id, materia, data_sessao, duracao_minutos, pontos_ganhos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, data.cronograma_id || null, data.materia, data.data_sessao, data.duracao_minutos, pontosGanhos]
    );

    connection.release();

    // Adicionar pontos ao usuário após a sessão ser criada
    await adicionarPontos(userId, pontosGanhos, `Sessão de estudo em ${data.materia} (${data.duracao_minutos}min)`);

    // Atualizar streak
    await atualizarStreak(userId);

    return getSessaoById(userId, id);
  } catch (error) {
    connection.release();
    throw error;
  }
};

export const updateSessao = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    const fields = [];
    const values = [];
    const allowedFields = ['materia', 'duracao_minutos', 'pontos_ganhos', 'data_sessao'];

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
      `UPDATE sessoes_estudo SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return getSessaoById(userId, id);
  } finally {
    connection.release();
  }
};

export const deleteSessao = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'DELETE FROM sessoes_estudo WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  } finally {
    connection.release();
  }
};

export default {
  getAllSessoes,
  getSessaoById,
  getSessoesByDate,
  getSessoesByDateRange,
  createSessao,
  updateSessao,
  deleteSessao
};
