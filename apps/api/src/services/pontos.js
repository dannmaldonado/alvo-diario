import { pool } from '../db/connection.js';

/**
 * Rating-based multiplier table.
 * Rating 1 = 0x, 2 = 0.5x, 3 = 1x (base), 4 = 1.5x, 5 = 2x
 */
export const RATING_MULTIPLIERS = {
  1: 0,
  2: 0.5,
  3: 1,
  4: 1.5,
  5: 2,
};

/**
 * Calcula pontos ganhos em uma sessão: 1 ponto por 15 minutos.
 * Optionally applies a rating multiplier.
 * Default rating = 3 (1x) preserves backwards compatibility.
 */
export const calcularPontos = (duracao_minutos, rating = 3) => {
  const base = Math.floor(duracao_minutos / 15);
  const multiplier = RATING_MULTIPLIERS[rating] ?? 1;
  return Math.floor(base * multiplier);
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

/**
 * Recalculates streak based on daily rating (avaliacao_diaria).
 * Only days with rating >= 3 count as "active days" for streak.
 * Always recalculates on every call (user may change their rating).
 *
 * Logic:
 * 1. Get all metas for user (last 365 days) ordered by date DESC
 * 2. Filter only metas with avaliacao_diaria >= 3
 * 3. Count consecutive days backward from today
 * 4. Update users.streak_atual
 */
/**
 * Adjusts user points based on daily rating.
 * Called when a rating is submitted via PATCH /api/metas/:id.
 * Calculates the delta between multiplied points and base points for the day.
 * Idempotent: only processes once per date (checked via historico_pontos 'rating_adjustment' entry).
 *
 * If the user changes their rating, we need to recalculate. To support re-rating,
 * we delete the previous rating_adjustment for that date and recalculate from scratch.
 */
export const ajustarPontosRating = async (userId, avaliacao_diaria, metaDate) => {
  if (avaliacao_diaria == null) return;

  const connection = await pool.getConnection();
  try {
    // Check if there's an existing rating adjustment for this date
    const [[existing]] = await connection.query(
      `SELECT id, pontos FROM historico_pontos
       WHERE user_id = ? AND DATE(data) = ? AND motivo = 'rating_adjustment'`,
      [userId, metaDate]
    );

    // If same-day adjustment exists, reverse it first
    if (existing) {
      const previousDelta = existing.pontos || 0;
      if (previousDelta !== 0) {
        await connection.query(
          'UPDATE users SET pontos_totais = pontos_totais - ? WHERE id = ?',
          [previousDelta, userId]
        );
      }
      await connection.query(
        'DELETE FROM historico_pontos WHERE id = ?',
        [existing.id]
      );
    }

    // Sum session minutes for the rated day
    const [[{ totalMinutos }]] = await connection.query(
      `SELECT COALESCE(SUM(duracao_minutos), 0) as totalMinutos
       FROM sessoes_estudo
       WHERE user_id = ? AND data_sessao = ?`,
      [userId, metaDate]
    );

    const basePoints = Math.floor(totalMinutos / 15);
    const multiplier = RATING_MULTIPLIERS[avaliacao_diaria] ?? 1;
    const adjustedPoints = Math.floor(basePoints * multiplier);
    const delta = adjustedPoints - basePoints; // negative, zero, or positive

    if (delta !== 0) {
      await connection.query(
        'UPDATE users SET pontos_totais = pontos_totais + ? WHERE id = ?',
        [delta, userId]
      );
    }

    // Record adjustment for audit and idempotency
    const { v4: uuidv4 } = await import('uuid');
    await connection.query(
      `INSERT INTO historico_pontos
         (id, user_id, data, pontos, motivo, rating_multiplier)
       VALUES (?, ?, ?, ?, 'rating_adjustment', ?)`,
      [uuidv4(), userId, metaDate, delta, multiplier]
    );
  } finally {
    connection.release();
  }
};

export const atualizarStreakByRating = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const hoje = new Date().toISOString().split('T')[0];

    // Get all metas in the last 365 days, ordered by date descending
    const limitDate = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
    const [metas] = await connection.query(
      'SELECT data, avaliacao_diaria FROM metas_diarias WHERE user_id = ? AND data >= ? ORDER BY data DESC',
      [userId, limitDate]
    );

    // Build a set of dates with rating >= 3 (active days)
    const activeDates = new Set();
    for (const meta of metas) {
      const rating = meta.avaliacao_diaria;
      if (rating != null && rating >= 3) {
        // Normalize date to YYYY-MM-DD string
        const dateStr = typeof meta.data === 'string'
          ? meta.data.split('T')[0]
          : new Date(meta.data).toISOString().split('T')[0];
        activeDates.add(dateStr);
      }
    }

    // Count consecutive days backward from today
    let streak = 0;
    const currentDate = new Date(hoje + 'T12:00:00'); // noon to avoid DST issues

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Update user's streak
    await connection.query(
      'UPDATE users SET streak_atual = ? WHERE id = ?',
      [streak, userId]
    );
  } finally {
    connection.release();
  }
};
