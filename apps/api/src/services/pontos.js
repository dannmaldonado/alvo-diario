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
 * Atualiza streak do usuario baseado nas sessoes de hoje e ontem.
 * Idempotent: only updates streak once per day by checking historico_pontos
 * for a "streak" entry. Prevents multiple increments when user creates
 * multiple sessions in the same day.
 */
export const atualizarStreak = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const hoje = new Date().toISOString().split('T')[0];

    // Check if streak was already updated today (idempotency guard)
    const [[{ streakUpdated }]] = await connection.query(
      'SELECT COUNT(*) as streakUpdated FROM historico_pontos WHERE user_id = ? AND DATE(data) = ? AND motivo = ?',
      [userId, hoje, 'streak']
    );

    if (streakUpdated > 0) {
      // Already processed streak for today, skip
      return;
    }

    const [[{ countHoje }]] = await connection.query(
      'SELECT COUNT(*) as countHoje FROM sessoes_estudo WHERE user_id = ? AND data_sessao = ?',
      [userId, hoje]
    );

    // Only update on the first session of the day (countHoje === 1 means
    // the session that triggered this call is the first one inserted today)
    if (countHoje !== 1) return;

    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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

    // Record streak update in historico_pontos to prevent re-processing
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await connection.query(
      'INSERT INTO historico_pontos (id, user_id, data, pontos, motivo) VALUES (?, ?, ?, ?, ?)',
      [id, userId, hoje, 0, 'streak']
    );
  } finally {
    connection.release();
  }
};
