import { pool } from '../db/connection.js';
import { createHistorico } from './historico.js';

/**
 * Calcula pontos ganhos em uma sessão de estudo
 * Fórmula: 1 ponto por 15 minutos estudados (arredondado para baixo)
 * @param {number} duracao_minutos - Duração da sessão em minutos
 * @returns {number} Pontos ganhos
 */
export const calcularPontosSessionao = (duracao_minutos) => {
  return Math.floor(duracao_minutos / 15);
};

/**
 * Adiciona pontos ao usuário e registra no histórico
 * @param {string} userId - ID do usuário
 * @param {number} pontos - Número de pontos a adicionar
 * @param {string} motivo - Motivo da adição de pontos
 * @returns {Promise<Object>} Usuário atualizado
 */
export const adicionarPontos = async (userId, pontos, motivo) => {
  const connection = await pool.getConnection();
  try {
    // Atualizar pontos_totais do usuário
    await connection.query(
      'UPDATE users SET pontos_totais = pontos_totais + ? WHERE id = ?',
      [pontos, userId]
    );

    // Registrar no histórico
    const hoje = new Date().toISOString().split('T')[0];
    await createHistorico(userId, {
      data: hoje,
      pontos,
      motivo
    });

    // Retornar usuário atualizado
    const [rows] = await connection.query(
      'SELECT id, email, nome, nivel_atual, pontos_totais, streak_atual, meta_diaria_horas FROM users WHERE id = ?',
      [userId]
    );

    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
};

/**
 * Verifica e atualiza a streak (ofensiva) do usuário
 * Incrementa se estudou hoje, reseta se não estudou ontem
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Usuário com streak atualizado
 */
export const atualizarStreak = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Verifica se há sessão de estudo hoje
    const [todaySession] = await connection.query(
      'SELECT COUNT(*) as count FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ?',
      [userId, hoje]
    );

    const temEstudoHoje = todaySession[0].count > 0;

    if (!temEstudoHoje) {
      // Se não estudou hoje, reseta streak para 0
      await connection.query(
        'UPDATE users SET streak_atual = 0 WHERE id = ?',
        [userId]
      );
    } else {
      // Se estudou hoje, verifica se estudou ontem para manter ou incrementar streak
      const [yesterdaySession] = await connection.query(
        'SELECT COUNT(*) as count FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ?',
        [userId, ontem]
      );

      const temEstudoOntem = yesterdaySession[0].count > 0;

      if (temEstudoOntem) {
        // Incrementar streak
        await connection.query(
          'UPDATE users SET streak_atual = streak_atual + 1 WHERE id = ?',
          [userId]
        );
      } else {
        // Começar nova streak
        await connection.query(
          'UPDATE users SET streak_atual = 1 WHERE id = ?',
          [userId]
        );
      }
    }

    // Retornar usuário atualizado
    const [rows] = await connection.query(
      'SELECT id, email, nome, nivel_atual, pontos_totais, streak_atual, meta_diaria_horas FROM users WHERE id = ?',
      [userId]
    );

    return rows.length > 0 ? rows[0] : null;
  } finally {
    connection.release();
  }
};

export default {
  calcularPontosSessionao,
  adicionarPontos,
  atualizarStreak
};
