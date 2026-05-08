import { runMigrations } from './index.js';

// Standalone CLI runner: npm run migrate
runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
