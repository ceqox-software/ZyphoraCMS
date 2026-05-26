/**
 * CMS version, read once at module load from `package.json`.
 *
 * We resolve the path relative to this file (via `import.meta.url`) rather
 * than the current working directory so the lookup works whether the server
 * is run from the repo root, the `dist/` output, or somewhere unexpected.
 *
 * Imported by admin chrome so the sidebar can display the running version.
 * Keeping it as a constant (vs. re-reading per request) is intentional —
 * the version of the code doesn't change between requests of the same
 * process, and we don't want a disk read on every admin page render.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// `src/lib/version.ts` → repo root is two levels up. The same relative
// jump applies to the built output because Astro preserves the source
// tree shape under `dist/server/`.
const pkgPath = join(here, '..', '..', 'package.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };

export const VERSION: string = pkg.version;
