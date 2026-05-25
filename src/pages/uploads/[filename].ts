/**
 * Runtime file server for `/uploads/<filename>`.
 *
 * Why this exists: with `output: 'server'` + the Node standalone adapter,
 * Astro only serves files that were under `public/` at build time. Media
 * uploaded after deploy lives under `public/uploads/` on disk but is invisible
 * to the static layer, so the request would 404. This route streams the file
 * from `UPLOADS_DIR` at request time instead.
 *
 * Path-traversal safe: the `[filename]` route param can only match a single
 * path segment, but we still reject `..`/separators and resolve-check the
 * final path so a future routing change can't widen the surface.
 */
import type { APIRoute } from 'astro';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, resolve, sep, extname } from 'node:path';
import { UPLOADS_DIR } from '../../lib/media.ts';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export const GET: APIRoute = ({ params }) => {
  const filename = params.filename;
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = join(UPLOADS_DIR, filename);
  const resolved = resolve(filePath);
  if (!resolved.startsWith(resolve(UPLOADS_DIR) + sep)) {
    return new Response('Not found', { status: 404 });
  }

  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    return new Response('Not found', { status: 404 });
  }

  const mime = MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'application/octet-stream';
  const body = readFileSync(resolved);
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': mime,
      // Filenames are random UUIDs, so cache aggressively. If the file at this
      // URL ever changed it would already break in-flight references; immutable
      // is accurate.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
};
