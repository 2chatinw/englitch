/*
 * Shared helpers for the Discord sign-in functions (Cloudflare Pages Functions).
 *
 * Settings (Cloudflare → Workers & Pages → englitch → Settings → Variables and Secrets):
 *   DISCORD_CLIENT_ID         Discord application ID (Discord Developer Portal → OAuth2)
 *   DISCORD_CLIENT_SECRET     Discord client secret            — store as a Secret
 *   FIREBASE_SERVICE_ACCOUNT  whole service-account JSON file  — store as a Secret
 *                             (Firebase console → Project settings → Service accounts → Generate new private key)
 */

export interface Env {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  FIREBASE_SERVICE_ACCOUNT?: string;
}

export interface Ctx { request: Request; env: Env }

export const STATE_COOKIE = 'englitch_dstate';

export function configured(env: Env): boolean {
  return !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.FIREBASE_SERVICE_ACCOUNT);
}

export function redirectUri(origin: string): string {
  return origin + '/api/auth/discord/callback';
}

/**
 * Sends the browser back to the app, leaving the result in sessionStorage
 * (never in the URL, so the token doesn't end up in history or logs).
 */
export function handoff(data: Record<string, string>, extraHeaders: Record<string, string> = {}): Response {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const html = '<!doctype html><meta charset="utf-8"><title>Englitch</title><meta name="robots" content="noindex">' +
    '<script>try{sessionStorage.setItem("englitch-discord",' + JSON.stringify(json).replace(/</g, '\\u003c') + ')}catch(e){}location.replace("/")</script>' +
    '<noscript>Englitch ต้องเปิด JavaScript เพื่อเข้าสู่ระบบ</noscript>';
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders,
    },
  });
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Firebase custom token (RS256 JWT signed with the service account key), valid for one hour. */
export async function createCustomToken(serviceAccountJson: string, uid: string, claims?: Record<string, unknown>): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const payload: Record<string, unknown> = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
  };
  if (claims) payload.claims = claims;
  const data = enc({ alg: 'RS256', typ: 'JWT' }) + '.' + enc(payload);
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  return data + '.' + b64url(new Uint8Array(sig));
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
