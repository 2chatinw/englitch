import { configured, handoff, redirectUri, STATE_COOKIE, type Ctx } from '../../../_lib/auth';

/** GET /api/auth/discord/start — sends the player to Discord's consent page. */
export const onRequestGet = async ({ request, env }: Ctx): Promise<Response> => {
  if (!configured(env)) return handoff({ error: 'not_configured' });
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const url = new URL('https://discord.com/oauth2/authorize');
  url.search = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri(origin),
    scope: 'identify email',
    state,
    prompt: 'none',
  }).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/api/auth/discord; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      'Cache-Control': 'no-store',
    },
  });
};
