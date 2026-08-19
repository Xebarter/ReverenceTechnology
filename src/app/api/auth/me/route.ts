import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser, upsertProfileAndAdmin } from '../../../../server/requireAuth';
import { eq, pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const isAdmin = await upsertProfileAndAdmin({
      uid: user.uid,
      email: user.email,
      name: user.name,
    });

    const { url, serviceKey } = requireSupabaseService();
    const { rows } = await pgSelect(url, serviceKey, 'profiles', eq('id', user.uid), 'id,email,full_name');
    const profile = rows[0] || null;

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      name: user.name || (profile?.full_name != null ? String(profile.full_name) : null),
      isAdmin,
    });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
