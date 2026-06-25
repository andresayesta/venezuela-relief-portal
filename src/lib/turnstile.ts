// Server-side Cloudflare Turnstile verification.
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// We POST the user's token to Cloudflare and trust only if "success" comes back.
// In dev (no secret key set), verification short-circuits to true so local
// testing doesn't require a live key.

const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret configured — allow in dev so locally we don't need a key.
    // Production deploys must set TURNSTILE_SECRET_KEY.
    return process.env.NODE_ENV !== 'production';
  }
  if (!token) return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);

  try {
    const res = await fetch(TURNSTILE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      // Don't cache verification.
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
