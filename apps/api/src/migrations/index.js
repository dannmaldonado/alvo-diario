import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MySQL error codes that are safe to ignore during migrations.
 * These represent "already exists" situations — idempotent by nature.
 *
 * 1050 — Table already exists (CREATE TABLE without IF NOT EXISTS)
 * 1060 — Duplicate column name (ADD COLUMN for a column that already exists)
 * 1061 — Duplicate key name (ADD INDEX for an index that already exists)
 * 1091 — Can't DROP column/key; doesn't exist
 */
const IGNORABLE_ERRNO = new Set([1050, 1060, 1061, 1091]);

export const runMigrations = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split on semicolons; skip empty/whitespace-only chunks
    const statements = schema.split(';').filter(s => s.trim());

    let ok = 0;
    let skipped = 0;

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      try {
        await connection.query(trimmed);
        ok++;
      } catch (err) {
        if (IGNORABLE_ERRNO.has(err.errno)) {
          // Column/table already exists — migration already applied, skip silently
          skipped++;
        } else {
          // Real error (syntax, permissions, etc.) — abort migration
          console.error('[migrations] Fatal error on statement:', trimmed.split('\n')[0]);
          throw err;
        }
      }
    }

    console.log(`✓ Migrations completed: ${ok} applied, ${skipped} already up-to-date`);
  } catch (error) {
    console.error('[migrations] Error:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
