
/**
 * Drizzle schema — the single source of truth for the SQLite layout.
 *
 * Migrations in `./drizzle/` are generated from this file via `npm run db:generate`
 * and applied by `npm run db:migrate`. Don't edit produced SQL by hand unless
 * you know exactly what you're doing — re-running generate after a manual
 * edit will overwrite it.
 *
 * Type aliases at the bottom (`User`, `NewPost`, etc.) are inferred from the
 * tables and re-exported so other modules don't need to import drizzle to
 * type their function signatures.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'author'] }).notNull().default('author'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  contentHtml: text('content_html').notNull().default(''),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  authorId: text('author_id').notNull().references(() => users.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const themes = sqliteTable('themes', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  author: text('author'),
  description: text('description'),
  bundled: integer('bundled', { mode: 'boolean' }).notNull().default(false),
  installedAt: integer('installed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;