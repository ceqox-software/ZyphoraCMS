/// <reference path="../.astro/types.d.ts" />

/**
 * Augments `Astro.locals` with the per-request fields populated by
 * `src/middleware.ts`. Keeping the types here means any `.astro` file can
 * read `Astro.locals.user` without an import.
 */
declare namespace App {
  interface Locals {
    user: import('./db/schema.ts').User | null;
    sessionId: string | null;
  }
}