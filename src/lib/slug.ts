/**
 * Convert a free-form string into a URL-safe slug.
 *
 * Steps:
 *   1. NFKD-normalize and strip combining marks so accented characters
 *      collapse to their base letter (e.g. "café" → "cafe").
 *   2. Replace anything outside `[a-z0-9]` with a single dash.
 *   3. Trim leading/trailing dashes.
 *   4. Cap at 80 chars to keep URLs reasonable and match the form schema.
 *   5. Fall back to "untitled" so we never return an empty string.
 *
 * Uniqueness is the caller's problem — see `uniqueSlug()` in `src/lib/posts.ts`.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}