/**
 * Tiny key-value wrapper around the `settings` table.
 *
 * Always go through these helpers — `setSetting` does the upsert dance so
 * callers don't have to think about whether the row exists yet.
 *
 * Values are always stored as strings. Callers serialize/parse on each side
 * (e.g. JSON.stringify a structured value before saving). Keeping the table
 * untyped keeps it easy to add new settings without schema changes.
 */
import { db, schema } from '../db/client.ts';
import { eq } from 'drizzle-orm';

/** Read a setting. Returns `fallback` when the row is missing. */
export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  return row?.value ?? fallback;
}

/** Upsert a setting. One atomic statement via SQLite's `ON CONFLICT`. */
export async function setSetting(key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}