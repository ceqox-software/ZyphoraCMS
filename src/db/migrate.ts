/**
 * Migration runner — applies every SQL file in `./drizzle/` that hasn't
 * already been recorded in the `__drizzle_migrations` bookkeeping table.
 *
 * Invoked via `npm run db:migrate`. Idempotent — safe to re-run.
 */
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client.ts';

migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied.');