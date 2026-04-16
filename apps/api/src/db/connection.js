import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple candidate paths (same logic as index.js)
// This runs before pool creation to ensure DB vars are available.
const envCandidates = [
  path.join(__dirname, '../../../../.env'),  // repo root from apps/api/src/db/
  path.join(__dirname, '../../.env'),         // apps/api/.env
  path.join(process.cwd(), '.env'),           // Hostinger app root
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alvo_diario',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true  // Return DECIMAL/NUMERIC columns as JS numbers, not strings
});

export default pool;
