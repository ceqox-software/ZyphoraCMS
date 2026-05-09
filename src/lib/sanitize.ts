/**
 * HTML sanitizer used on every piece of user-authored markup before storage.
 *
 * The allowlist is intentionally narrow — covers what the TipTap toolbar can
 * produce. Adding tags here loosens the security boundary, so think before
 * you add and prefer to extend the editor toolbar to match an existing tag
 * over opening up an exotic one.
 *
 * IMPORTANT: every field that holds rich HTML must be run through this
 * function before insert/update. The public site renders post HTML raw
 * (`set:html` / Eta `<%~ %>`), and that's only safe because the value was
 * sanitized on the way in. Bypassing this is a stored-XSS vulnerability.
 *
 * Notable exclusions: no `<script>`, no `<iframe>`, no inline event handlers
 * (DOMPurify drops those by default), no `data-*` (we don't use them and
 * they're a common source of CSS/script smuggling).
 */
import DOMPurify from 'isomorphic-dompurify';

/** Run untrusted HTML through DOMPurify with the project allowlist. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 'figure', 'figcaption',
      'hr', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}