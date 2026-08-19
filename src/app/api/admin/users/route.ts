import { NextResponse } from 'next/server';
import { isFirebaseAdminConfigured, getFirebaseAdminAuth } from '../../../../lib/firebaseAdmin';
import { authErrorResponse, requireAdmin } from '../../../../server/requireAuth';
import { eq, pgInsertRow, pgPatch, pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';

export const runtime = 'nodejs';

async function maybeSetAdminClaim(uid: string, admin: boolean) {
  if (!isFirebaseAdminConfigured()) return;
  try {
    await getFirebaseAdminAuth().setCustomUserClaims(uid, { admin });
  } catch (e) {
    console.error('[admin/users] claims', e);
  }
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(
      url,
      serviceKey,
      'admin_users',
      'order=created_at.desc',
      'id,email,full_name,is_active,created_at',
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ users: rows });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json().catch(() => null)) as { email?: string; full_name?: string } | null;
    const email = body?.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const { url, serviceKey } = requireSupabaseService();
    const { rows: profiles } = await pgSelect(url, serviceKey, 'profiles', eq('email', email), 'id,email,full_name');
    const profile = profiles[0];
    if (!profile) {
      return NextResponse.json(
        { error: 'No user found with this email. Ask them to create an account first.' },
        { status: 404 },
      );
    }

    const uid = String(profile.id);
    const { error } = await pgInsertRow(url, serviceKey, 'admin_users', {
      id: uid,
      email,
      full_name: body?.full_name?.trim() || profile.full_name || null,
      is_active: true,
    });
    if (error) {
      if (/duplicate|unique/i.test(error)) {
        return NextResponse.json({ error: 'This user is already an admin' }, { status: 409 });
      }
      return NextResponse.json({ error }, { status: 400 });
    }

    await maybeSetAdminClaim(uid, true);

    return NextResponse.json({ ok: true, id: uid });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json().catch(() => null)) as { id?: string; is_active?: boolean } | null;
    const id = body?.id?.trim();
    if (!id || typeof body?.is_active !== 'boolean') {
      return NextResponse.json({ error: 'id and is_active are required' }, { status: 400 });
    }
    const { url, serviceKey } = requireSupabaseService();
    const { error } = await pgPatch(url, serviceKey, 'admin_users', eq('id', id), { is_active: body.is_active });
    if (error) return NextResponse.json({ error }, { status: 400 });
    await maybeSetAdminClaim(id, body.is_active);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin(req);
    const urlObj = new URL(req.url);
    const id = (urlObj.searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { url, serviceKey } = requireSupabaseService();
    const res = await fetch(
      `${url.replace(/\/+$/, '')}/rest/v1/admin_users?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text.slice(0, 400) || 'Failed to remove admin' }, { status: 400 });
    }
    await maybeSetAdminClaim(id, false);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
