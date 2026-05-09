/**
 * Database client — single SQLite connection shared across the app.
 *
 * The path is overridable via `DATABASE_PATH` so tests / alternate deploys
 * can point at a different file. The directory is auto-created on first run
 * so a fresh checkout doesn't have to `mkdir data` before migrating.
 *
 * Why these pragmas:
 *  - WAL improves concurrent read+write throughput and avoids blocking
 *    writers behind readers.
 *  - foreign_keys is OFF by default in SQLite (yes, really) — turning it on
 *    here so our `references()` constraints actually fire.
 *
 * Drizzle is exported alongside the schema so callers can write
 * `db.select().from(schema.posts)` without an extra import.
 *
 * Note that the `better-sqlite3` driver is synchronous — `db.select()...get()`
 * returns a value, not a Promise. Call sites still write `await db...` so a
 * future swap to libsql or Postgres (both async) won't require touching every
 * callsite. `astro check` flags the `await`s as `ts(80007)` hints; that is
 * intentional, do not strip them.
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema.ts';

// Resolve the on-disk DB path. Default keeps a fresh checkout self-contained
// under ./data/; override via env for tests or alternate deploys.
const DB_PATH = process.env.DATABASE_PATH ?? './data/zyphora.db';

// Ensure the parent directory exists. better-sqlite3 will happily create the
// file but not the folder, so a fresh clone would otherwise fail to migrate.
const dir = dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// Open the SQLite database and tune pragmas. See module header for rationale.
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Wrap the raw connection in Drizzle, bound to our schema so query builders
// stay typed end-to-end.
export const db = drizzle(sqlite, { schema });
export { schema };