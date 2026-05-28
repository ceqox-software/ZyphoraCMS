/**
 * Database client — single MySQL connection pool shared across the app.
 *
 * Connection settings come from four env vars; there's no `DATABASE_URL`
 * convenience form because passing them individually makes it harder to
 * leak a full DSN into a log line by accident. `DB_PORT` defaults to 3306;
 * the others have no defaults — missing any of them fails fast at boot.
 *
 *   DB_HOST  hostname or IP of the MySQL server
 *   DB_PORT  TCP port (default 3306)
 *   DB_USER  account name
 *   DB_PASS  account password
 *   DB_NAME  database/schema name
 *
 * Charset is pinned to utf8mb4 so emoji and other non-BMP characters in post
 * titles and content survive a round-trip. (MySQL's "utf8" alias is the
 * historical 3-byte form and would silently corrupt 4-byte sequences.)
 *
 * Drizzle is exported alongside the schema so callers can write
 * `db.select().from(schema.posts)` without an extra import. With the mysql2
 * driver, query builders are genuinely async — `await db.select()...where()`
 * resolves to a row array. Drop `.get()` / `.all()` style chains used by the
 * previous better-sqlite3 driver and prefer `(await ...limit(1))[0]` for
 * "first or undefined" reads.
 */
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.ts';

// Fail fast on boot if any required env var is missing — silent fallbacks
// would let a misconfigured deploy run and only crash on first query.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var ${name}. Set ${name} before starting the app.`);
  }
  return value;
}

const host = requireEnv('DB_HOST');
const user = requireEnv('DB_USER');
const password = requireEnv('DB_PASS');
const database = requireEnv('DB_NAME');
// Port is the one optional knob — 3306 is the MySQL default and the right
// value for the vast majority of deploys.
const port = Number(process.env.DB_PORT ?? 3306);

// One pool per process. mysql2 handles connection lifecycle; we keep the
// upper bound conservative because Astro under the Node adapter does its own
// request concurrency and there's no benefit to letting one slow query starve
// the pool.
const pool = createPool({
  host,
  port,
  user,
  password,
  database,
  charset: 'utf8mb4',
  connectionLimit: 10,
  // Decode DATE/DATETIME/TIMESTAMP as JS Date so Drizzle's `timestamp` columns
  // round-trip cleanly. mysql2 defaults to this for `timestamp`, but being
  // explicit avoids drift if a future driver release changes the default.
  dateStrings: false,
});

// Wrap the pool in Drizzle, bound to our schema so query builders stay typed
// end-to-end. `mode: 'default'` matches the standard MySQL planner behavior;
// the alternative (`'planetscale'`) trades some semantics for compatibility
// with serverless backends that don't support cross-table foreign keys, which
// we don't want here.
export const db = drizzle(pool, { schema, mode: 'default' });
export { schema };
