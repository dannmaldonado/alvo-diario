import { pool } from '../db/connection.js';

/**
 * Calcula pontos ganhos em uma sessão: 1 ponto por 15 minutos
 */
export const calcularPontos = (duracao_minutos) => {
  return Math.floor(duracao_minutos / 15);
};

/**
 * Adiciona pontos ao usuário e registra no histórico
 */
export const adicionarPontos = async (userId, pontos, motivo) => {
  if (pontos <= 0) return;
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE users SET pontos_totais = pontos_totais + ? WHERE id = ?',
      [pontos, userId]
    );
    const hoje = new Date().toISOString().split('T')[0];
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await connection.query(
      'INSERT INTO historico_pontos (id, user_id, data, pontos, motivo) VALUES (?, ?, ?, ?, ?)',
      [id, userId, hoje, pontos, motivo]
    );
  } finally {
    connection.release();
  }
};

/**
 * Atualiza streak do usuário baseado nas sessões de hoje e ontem
 */
export const atualizarStreak = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [[{ countHoje }]] = await connection.query(
      'SELECT COUNT(*) as countHoje FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ?',
      [userId, hoje]
    );

    if (countHoje === 0) return;

    const [[{ countOntem }]] = await connection.query(
      'SELECT COUNT(*) as countOntem FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ?',
      [userId, ontem]
    );

    if (countOntem > 0) {
      await connection.query(
        'UPDATE users SET streak_atual = streak_atual + 1 WHERE id = ?',
        [userId]
      );
    } else {
      await connection.query(
        'UPDATE users SET streak_atual = 1 WHERE id = ?',
        [userId]
      );
    }
  } finally {
    connection.release();
  }
};
