# ZyphoraCMS

A self-hosted, WordPress-style CMS built on Astro. SSR public site, admin panel at `/admin`, SQLite + Drizzle, session-cookie auth, and a TipTap block editor.

## Stack

- **Astro 6** with Node adapter (`output: 'server'`)
- **SQLite** via `better-sqlite3` + **Drizzle ORM**
- **React** island for the **TipTap** rich-text editor
- Argon2 password hashing (`@node-rs/argon2`)
- HTML sanitization with DOMPurify
- Zod for form validation

## Features

- **Posts** — draft/publish workflow, slug auto-generation, rich-text editor with headings, lists, blockquotes, code blocks, links, and inline code
- **Media library** — upload images, video, and PDFs (10 MB limit)
- **Users & roles** — `admin`, `editor`, `author`; admins manage users, editors edit any post, authors edit only their own
- **Settings** — site title/description, password change
- **Public site** — minimalist editorial theme rendering published posts at `/` and `/posts/[slug]`
- **Collapsible sidebar** — full or rail mode, persisted per-user via cookie

## Requirements

- Node `>=22.12.0`

## Quick start

```sh
npm install
npm run db:migrate
npm run db:seed     # creates admin@zyphora.local / changeme123
npm run dev         # http://localhost:4321
```

Then visit [http://localhost:4321/admin/login](http://localhost:4321/admin/login) and sign in. Change the password in **Settings → Change your password** immediately.

You can override the seed credentials with environment variables:

```sh
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=secret SEED_ADMIN_NAME="Your Name" npm run db:seed
```

## Scripts

| Command               | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Start the dev server at `http://localhost:4321`       |
| `npm run build`       | Build to `./dist/` (Node standalone server)           |
| `npm run preview`     | Run the production build locally                      |
| `npm run db:generate` | Generate a new Drizzle migration from `schema.ts`     |
| `npm run db:migrate`  | Apply pending migrations to `./data/zyphora.db`       |
| `npm run db:seed`     | Idempotent — creates first admin and default settings |
| `npm run db:studio`   | Open the Drizzle Studio DB browser                    |

## Project layout

```
src/
├── components/        React islands (TipTap editor)
├── db/                Drizzle schema, client, migrate/seed scripts
├── layouts/           AdminLayout, SiteLayout
├── lib/               auth, posts, media, settings, sanitize, slug
├── middleware.ts      session lookup + admin route guard
├── pages/
│   ├── admin/         dashboard, posts CRUD, media, users, settings
│   ├── posts/[slug]   public post detail
│   └── index.astro    public home (post list)
└── styles/
drizzle/               generated SQL migrations
public/                static assets and uploads (uploads gitignored)
data/                  SQLite database file (gitignored)
```

## Configuration

Environment variables (all optional):

| Variable                | Default                  | Description                          |
| ----------------------- | ------------------------ | ------------------------------------ |
| `DATABASE_PATH`         | `./data/zyphora.db`      | SQLite file location                 |
| `DATABASE_URL`          | `file:./data/zyphora.db` | Used by `drizzle-kit` only           |
| `SEED_ADMIN_EMAIL`      | `admin@zyphora.local`    | First admin email (seed script)      |
| `SEED_ADMIN_PASSWORD`   | `changeme123`            | First admin password (seed script)   |
| `SEED_ADMIN_NAME`       | `Admin`                  | First admin display name             |

## Production

```sh
npm run build
node ./dist/server/entry.mjs
```

The built server is a standalone Node process. Place it behind a reverse proxy (nginx, Caddy) and serve `public/uploads/` either from the same Node server (default) or from a static file server / CDN.

## Roadmap

- Pages (vs. posts) with hierarchy
- Comments with moderation
- Taxonomies (categories, tags)
- RSS / Atom feed
- Image resizing and responsive `srcset`
- Pluggable storage adapter (S3, R2) for media

## License

MIT