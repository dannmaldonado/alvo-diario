import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✓ Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
