/**
 * Google reCAPTCHA v2 verification.
 *
 * Two-key model: admins configure a site key (safe to expose in the browser
 * because Google's widget uses it to render) and a secret key (server-only,
 * used to verify tokens). Both are stored in the `settings` table under
 * `recaptcha_site_key` and `recaptcha_secret_key`.
 *
 * Opt-in: when either key is empty we treat reCAPTCHA as disabled and skip
 * verification entirely. That preserves existing-install behavior — a fresh
 * checkout still posts comments without anyone having to fill in keys first.
 *
 * Fail-closed: when a token is missing, malformed, rejected by Google, or
 * the verify HTTP call itself errors, we return `false` rather than letting
 * the comment through. A flaky upstream shouldn't silently open a spam window.
 */
import { getSetting } from './settings.ts';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Subset of Google's siteverify response we actually inspect. `success` is the
 * single source of truth; everything else is logged/diagnostic and ignored
 * here.
 */
type SiteVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
};

export type RecaptchaConfig = {
  /** Public site key, safe to expose in template HTML. `null` when unset. */
  siteKey: string | null;
  /** Server-only secret. `null` when unset — never expose to templates. */
  secretKey: string | null;
  /** Convenience: true iff both keys are present and non-empty. */
  enabled: boolean;
};

/**
 * Load both reCAPTCHA keys from settings. We always read both together so
 * callers can't accidentally pick up half-configured state — partial config
 * (one key set, one empty) is treated as disabled.
 */
export async function getRecaptchaConfig(): Promise<RecaptchaConfig> {
  const [siteKey, secretKey] = await Promise.all([
    getSetting('recaptcha_site_key', ''),
    getSetting('recaptcha_secret_key', ''),
  ]);
  const enabled = siteKey.length > 0 && secretKey.length > 0;
  return {
    siteKey: siteKey || null,
    secretKey: secretKey || null,
    enabled,
  };
}

/**
 * Verify a reCAPTCHA v2 token against Google's siteverify endpoint.
 *
 * Returns true only when Google confirms the token. Any other outcome — empty
 * token, non-2xx response, JSON shaped differently than expected, network
 * exception — returns false. The error-codes array is intentionally not
 * surfaced; callers show a single user-facing message regardless of cause
 * to avoid hinting at internals to bots probing the form.
 */
export async function verifyRecaptchaToken(
  token: string | undefined | null,
  secretKey: string,
  remoteIp?: string,
): Promise<boolean> {
  if (!token || token.length === 0) return false;

  const params = new URLSearchParams({ secret: secretKey, response: token });
  // remoteip is optional per Google's docs but improves their risk scoring.
  // Only include when the host actually provided a client address (Astro
  // exposes it as a string; an empty string would be useless to send).
  if (remoteIp && remoteIp.length > 0) params.set('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteVerifyResponse;
    return data.success === true;
  } catch {
    // Network error, DNS failure, JSON parse error, etc. Fail-closed.
    return false;
  }
}
