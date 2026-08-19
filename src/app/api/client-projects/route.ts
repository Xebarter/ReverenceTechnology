import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser } from '../../../server/requireAuth';
import { eq, pgInsertRow, pgSelect } from '../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../server/supabaseEnv';
import { mapClientProject } from '../../../server/clientProjects';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(
      url,
      serviceKey,
      'client_projects',
      `${eq('user_id', user.uid)}&order=created_at.desc`,
      '*',
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ projects: rows.map(mapClientProject) });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const body = (await req.json().catch(() => null)) as {
      title?: string;
      description?: string;
      service_id?: string | null;
      customer_name?: string;
      customer_phone?: string;
    } | null;

    const title = body?.title?.trim();
    const description = body?.description?.trim() || '';
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const { url, serviceKey } = requireSupabaseService();
    const { row, error } = await pgInsertRow(url, serviceKey, 'client_projects', {
      user_id: user.uid,
      title,
      description,
      service_id: body?.service_id || null,
      status: 'submitted',
      amount_paid: 0,
      customer_name: body?.customer_name?.trim() || user.name || null,
      customer_email: user.email,
      customer_phone: body?.customer_phone?.trim() || null,
    });
    if (error || !row) return NextResponse.json({ error: error || 'Could not create project' }, { status: 400 });
    return NextResponse.json({ project: mapClientProject(row) }, { status: 201 });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
