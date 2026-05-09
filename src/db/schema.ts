

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

// Authoring accounts. `role` gates what the UI exposes and what `lib/auth.ts`
// allows; `passwordHash` is Argon2 (see lib/auth.ts), never anything else.
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'author'] }).notNull().default('author'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Server-side session records keyed by the random token in the
// `zyphora_session` cookie. Cascades on user delete so removing a user
// implicitly logs out their open sessions.
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// Posts — the only content type currently. `contentHtml` is post-sanitization
// HTML (see lib/sanitize.ts); `slug` is uniquified by lib/posts.ts before
// insert. Drafts are filtered out of public queries everywhere.
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

// Uploaded files. The bytes themselves live under `public/uploads/`; this
// table only holds metadata. `filename` is the random UUID name on disk;
// `originalName` is what the user uploaded.
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Generic key/value site settings (e.g. `site_title`, `active_theme`).
// All access goes through lib/settings.ts so upserts stay consistent.
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Theme registry — kept in sync with what's actually on disk under `themes/`.
// `bundled` marks themes that ship in-repo (e.g. `default`) so they can't be
// uninstalled from the admin UI.
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