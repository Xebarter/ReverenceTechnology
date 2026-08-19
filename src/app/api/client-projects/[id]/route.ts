import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser } from '../../../../server/requireAuth';
import { eq, pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import { mapClientProject, mapInstallment } from '../../../../server/clientProjects';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function projectId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFirebaseUser(req);
    const id = await projectId(context);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(url, serviceKey, 'client_projects', eq('id', id), '*');
    if (error) return NextResponse.json({ error }, { status: 400 });
    const row = rows[0];
    if (!row || String(row.user_id) !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { rows: payments } = await pgSelect(
      url,
      serviceKey,
      'payment_installments',
      `${eq('client_project_id', id)}&order=requested_at.desc`,
      '*',
    );

    return NextResponse.json({
      project: mapClientProject(row),
      installments: payments.map(mapInstallment),
    });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
