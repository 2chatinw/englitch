/*
 * Serves Firebase's sign-in helper pages (/__/auth/*, /__/firebase/*) from englitch.pages.dev itself.
 * Browsers that block third-party storage (Safari, Chrome without popups) can't finish a Google
 * sign-in that runs on englitch-da50c.firebaseapp.com; proxying keeps it same-origin.
 * See "Best practices for using signInWithRedirect on browsers that block third-party storage".
 *
 * public/_routes.json limits Functions to /api/* and /__/*, so static files never hit this code.
 */
const FIREBASE_HOST = 'englitch-da50c.firebaseapp.com';

interface MiddlewareCtx { request: Request; next: () => Promise<Response> }

export const onRequest = async ({ request, next }: MiddlewareCtx): Promise<Response> => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/__/')) return next();
  const target = new URL(url.pathname + url.search, 'https://' + FIREBASE_HOST);
  const headers = new Headers(request.headers);
  headers.delete('host');
  const res = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
};
