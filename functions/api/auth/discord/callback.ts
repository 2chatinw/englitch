import { configured, createCustomToken, handoff, readCookie, redirectUri, STATE_COOKIE, type Ctx } from '../../../_lib/auth';

interface DiscordUser { id: string; username: string; global_name?: string | null; avatar?: string | null; email?: string | null; verified?: boolean }

const clearState = { 'Set-Cookie': `${STATE_COOKIE}=; Path=/api/auth/discord; HttpOnly; Secure; SameSite=Lax; Max-Age=0` };

/** GET /api/auth/discord/callback — Discord sends the player back here with a one-time code. */
export const onRequestGet = async ({ request, env }: Ctx): Promise<Response> => {
  if (!configured(env)) return handoff({ error: 'not_configured' }, clearState);
  const url = new URL(request.url);
  const err = url.searchParams.get('error');
  if (err) return handoff({ error: err === 'access_denied' ? 'access_denied' : 'failed' }, clearState);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = readCookie(request, STATE_COOKIE);
  if (!code || !state || !expected || state !== expected) return handoff({ error: 'state' }, clearState);

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID!,
        client_secret: env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(url.origin),
      }),
    });
    if (!tokenRes.ok) return handoff({ error: 'failed' }, clearState);
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) return handoff({ error: 'failed' }, clearState);

    const meRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + access_token } });
    if (!meRes.ok) return handoff({ error: 'failed' }, clearState);
    const me = (await meRes.json()) as DiscordUser;
    if (!/^\d+$/.test(me.id)) return handoff({ error: 'failed' }, clearState);

    const token = await createCustomToken(env.FIREBASE_SERVICE_ACCOUNT!, 'discord:' + me.id, { provider: 'discord' });
    const name = (me.global_name || me.username || 'Discord player').slice(0, 40);
    const photo = me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128` : '';
    const email = me.verified && me.email ? me.email : '';
    return handoff({ token, name, photo, email }, clearState);
  } catch {
    return handoff({ error: 'failed' }, clearState);
  }
};
