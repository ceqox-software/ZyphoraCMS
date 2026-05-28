/**
 * Migration runner — applies every SQL file in `./drizzle/` that hasn't
 * already been recorded in the `__drizzle_migrations` bookkeeping table.
 *
 * Invoked via `npm run db:migrate`. Idempotent — safe to re-run.
 *
 * Calls `process.exit(0)` at the end because the mysql2 pool keeps the event
 * loop alive otherwise (idle connections waiting to be reused).
 */
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './client.ts';

await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied.');
process.exit(0);
