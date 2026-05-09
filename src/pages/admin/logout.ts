/**
 * Logout endpoint — drops the session row and clears the cookie, then
 * sends the user to the login page.
 *
 * `GET = POST` so a stale session that visits this URL via a back-button
 * navigation (or a noscript form-as-link) still logs out cleanly.
 */
import type { APIRoute } from 'astro';
import { deleteSession, clearSessionCookie } from '../../lib/auth.ts';

export const POST: APIRoute = async (ctx) => {
  if (ctx.locals.sessionId) await deleteSession(ctx.locals.sessionId);
  clearSessionCookie(ctx);
  return ctx.redirect('/admin/login');
};

export const GET = POST;