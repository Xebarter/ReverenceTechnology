import { NextResponse } from 'next/server';
import { authErrorResponse, requireAdmin } from '../../../../server/requireAuth';
import { pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import { mapClientProject } from '../../../../server/clientProjects';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(
      url,
      serviceKey,
      'client_projects',
      'order=created_at.desc',
      '*',
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ projects: rows.map(mapClientProject) });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
