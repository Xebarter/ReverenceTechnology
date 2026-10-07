import { cookies } from 'next/headers';
import { FB_SESSION_COOKIE } from '../lib/authCookies';
import { eq, pgPatch, pgSelect, pgUpsertRow } from './supabasePostgrest';
import { requireSupabaseService } from './supabaseEnv';
import { verifyFirebaseIdToken } from './verifyFirebaseIdToken';
import { claimOrdersForEmail } from './claimOrders';

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  admin: boolean;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function upsertProfileAndAdmin(user: {
  uid: string;
  email?: string | null;
  name?: string | null;
}): Promise<boolean> {
  const { url, serviceKey } = requireSupabaseService();
  const email = user.email?.trim().toLowerCase() || null;
  const fullName = user.name?.trim() || null;

  await pgUpsertRow(
    url,
    serviceKey,
    'profiles',
    {
      id: user.uid,
      email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    'id',
  );

  if (email) await claimOrdersForEmail(user.uid, email);

  let isAdmin = false;
  if (email) {
    const { rows: byEmail } = await pgSelect(
      url,
      serviceKey,
      'admin_users',
      eq('email', email),
      'id,is_active,full_name',
    );
    const existing = byEmail[0];
    if (existing) {
      if (String(existing.id) !== user.uid) {
        await pgPatch(url, serviceKey, 'admin_users', eq('email', email), {
          id: user.uid,
          full_name: fullName || existing.full_name || null,
        });
      }
      isAdmin = existing.is_active !== false;
    }
  }

  if (!isAdmin) {
    const { rows: byId } = await pgSelect(
      url,
      serviceKey,
      'admin_users',
      `${eq('id', user.uid)}&${eq('is_active', 'true')}`,
      'id',
    );
    isAdmin = Boolean(byId[0]);
  }

  return isAdmin;
}

export async function requireFirebaseUser(req: Request): Promise<AuthUser> {
  const idToken = bearerToken(req) || (await cookies()).get(FB_SESSION_COOKIE)?.value;
  if (!idToken) {
    throw new AuthError('Not signed in');
  }

  try {
    return await verifyFirebaseIdToken(idToken);
  } catch (e) {
    if (e instanceof Error && /NEXT_PUBLIC_FIREBASE_PROJECT_ID/.test(e.message)) {
      throw e;
    }
    throw new AuthError('Not signed in');
  }
}

export async function requireAdmin(req: Request): Promise<AuthUser> {
  const user = await requireFirebaseUser(req);
  const { url, serviceKey } = requireSupabaseService();
  const { rows } = await pgSelect(
    url,
    serviceKey,
    'admin_users',
    `${eq('id', user.uid)}&${eq('is_active', 'true')}`,
    'id',
  );
  if (!rows[0] && user.email) {
    const { rows: byEmail } = await pgSelect(
      url,
      serviceKey,
      'admin_users',
      `${eq('email', user.email.toLowerCase())}&${eq('is_active', 'true')}`,
      'id',
    );
    if (byEmail[0]) {
      return { ...user, admin: true };
    }
  }
  if (!rows[0]) {
    throw new AuthError('Admin access required', 403);
  }
  return { ...user, admin: true };
}

export function authErrorResponse(e: unknown): { body: { error: string }; status: number } {
  if (e instanceof AuthError) {
    return { body: { error: e.message }, status: e.status };
  }
  const message = e instanceof Error ? e.message : 'Authentication failed';
  const status = /not configured|Missing SUPABASE/i.test(message) ? 500 : 401;
  return { body: { error: message }, status };
}
