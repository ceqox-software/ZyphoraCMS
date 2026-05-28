/**
 * First-run seed script.
 *
 * Idempotent — re-running on an already-seeded DB only logs and exits.
 * Reads admin credentials from env (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
 * `SEED_ADMIN_NAME`) so production deploys can avoid the well-known defaults.
 *
 * Three things get seeded on a fresh DB:
 *  1. The four system roles (admin, editor, author, subscriber). These used to
 *     ship via INSERT migrations under SQLite; on MySQL we keep them out of
 *     the schema migration so the schema stays purely structural and the
 *     bootstrap data lives here where it can read env-driven overrides.
 *  2. The bootstrap admin user (matching SEED_ADMIN_EMAIL).
 *  3. Default site settings (title, description).
 *
 * Each step gates on the presence of its own sentinel row so re-running this
 * script is always safe.
 */
import { db, schema } from './client.ts';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';

// System roles. These slugs are referenced by name elsewhere (the admin user
// gets `admin`, /register hands out `subscriber`, etc.), so they must exist
// before the first user is created. `system: true` flags them as undeletable
// in the roles admin UI.
const SYSTEM_ROLES: Array<{ slug: string; name: string; permissions: string[] }> = [
  {
    slug: 'admin',
    name: 'Admin',
    permissions: [
      'manage_users',
      'manage_roles',
      'manage_posts_any',
      'manage_posts_own',
      'manage_media',
      'manage_themes',
      'manage_settings',
    ],
  },
  {
    slug: 'editor',
    name: 'Editor',
    permissions: ['manage_posts_any', 'manage_posts_own', 'manage_media'],
  },
  {
    slug: 'author',
    name: 'Author',
    permissions: ['manage_posts_own', 'manage_media'],
  },
  // Subscriber is the role assigned to anyone signing up via /register. Empty
  // permission set on purpose — they get a profile but no authoring rights
  // until an admin promotes them.
  { slug: 'subscriber', name: 'Subscriber', permissions: [] },
];

// Find which system roles are already present so we only insert the missing
// ones. A single SELECT keeps this O(1) queries regardless of how many roles
// we add later.
const existingRoleRows = await db
  .select({ slug: schema.roles.slug })
  .from(schema.roles)
  .where(
    inArray(
      schema.roles.slug,
      SYSTEM_ROLES.map((r) => r.slug),
    ),
  );
const existingRoleSlugs = new Set(existingRoleRows.map((r) => r.slug));
const rolesToInsert = SYSTEM_ROLES.filter((r) => !existingRoleSlugs.has(r.slug));
if (rolesToInsert.length > 0) {
  await db.insert(schema.roles).values(
    rolesToInsert.map((r) => ({ slug: r.slug, name: r.name, permissions: r.permissions, system: true })),
  );
  console.log(`Seeded ${rolesToInsert.length} system role(s): ${rolesToInsert.map((r) => r.slug).join(', ')}`);
}

// Resolve seed credentials. Defaults are fine for local dev but should be
// overridden via env in any non-throwaway deployment.
const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@zyphora.local';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123';
const displayName = process.env.SEED_ADMIN_NAME ?? 'Admin';

// Create the bootstrap admin only if no user with this email exists yet.
// Re-running the script on an already-seeded DB is a no-op.
const existingRows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
const existing = existingRows[0];
if (existing) {
  console.log(`User ${email} already exists — skipping.`);
} else {
  const passwordHash = await hash(password);
  await db.insert(schema.users).values({
    id: randomUUID(),
    email,
    passwordHash,
    displayName,
    role: 'admin',
  });
  console.log(`Admin user created: ${email} / ${password}`);
  console.log('Change the password after first login.');
}

// Insert default site settings on first run. Presence of `site_title` is the
// sentinel for whether settings have been seeded.
const siteTitleRows = await db.select().from(schema.settings).where(eq(schema.settings.key, 'site_title')).limit(1);
if (siteTitleRows.length === 0) {
  await db.insert(schema.settings).values([
    { key: 'site_title', value: 'Zyphora' },
    { key: 'site_description', value: 'A site powered by Zyphora' },
  ]);
  console.log('Default settings created.');
}

// Explicit exit — the mysql2 pool keeps the event loop alive otherwise
// (idle connections waiting to be reused).
process.exit(0);
