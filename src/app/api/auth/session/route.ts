import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FB_ADMIN_COOKIE, FB_SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '../../../../lib/authCookies';
import { upsertProfileAndAdmin } from '../../../../server/requireAuth';
import { verifyFirebaseIdToken } from '../../../../server/verifyFirebaseIdToken';

export const runtime = 'nodejs';

function cookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { idToken?: string } | null;
    const idToken = body?.idToken?.trim();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const isAdmin = await upsertProfileAndAdmin({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });

    const jar = await cookies();
    jar.set(FB_SESSION_COOKIE, idToken, cookieOptions());
    jar.set(FB_ADMIN_COOKIE, isAdmin ? '1' : '0', cookieOptions());

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      isAdmin,
    });
  } catch (e) {
    console.error('[auth/session] POST', e);
    return NextResponse.json({ error: 'Could not create session' }, { status: 401 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(FB_SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  jar.set(FB_ADMIN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return NextResponse.json({ ok: true });
}
