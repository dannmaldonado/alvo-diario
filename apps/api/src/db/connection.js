import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alvo_diario',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// Test connection (non-fatal - server starts even if DB is temporarily unavailable)
pool.getConnection()
  .then(conn => {
    console.log('Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection warning:', err.message);
  });

export default pool;
