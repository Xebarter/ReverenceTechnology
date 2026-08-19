import { NextResponse } from 'next/server';
import { authErrorResponse, requireAdmin } from '../../../../../server/requireAuth';
import { eq, pgPatch, pgSelect } from '../../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../../server/supabaseEnv';
import { mapClientProject, mapInstallment } from '../../../../../server/clientProjects';
import type { ClientProjectStatus } from '../../../../../lib/types';

export const runtime = 'nodejs';

const STATUSES: ClientProjectStatus[] = [
  'submitted',
  'in_review',
  'active',
  'paused',
  'completed',
  'cancelled',
];

async function projectId(context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await Promise.resolve(context.params);
  return params.id;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await requireAdmin(req);
    const id = await projectId(context);
    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(url, serviceKey, 'client_projects', eq('id', id), '*');
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (!rows[0]) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { rows: payments } = await pgSelect(
      url,
      serviceKey,
      'payment_installments',
      `${eq('client_project_id', id)}&order=requested_at.desc`,
      '*',
    );

    return NextResponse.json({
      project: mapClientProject(rows[0]),
      installments: payments.map(mapInstallment),
    });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await requireAdmin(req);
    const id = await projectId(context);
    const body = (await req.json().catch(() => null)) as {
      status?: string;
      agreed_total?: number | null;
      progress_note?: string | null;
      admin_notes?: string | null;
    } | null;

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body?.status) {
      if (!STATUSES.includes(body.status as ClientProjectStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (body && 'agreed_total' in body) {
      patch.agreed_total =
        body.agreed_total == null || body.agreed_total === ('' as unknown as number)
          ? null
          : Number(body.agreed_total);
    }
    if (body && 'progress_note' in body) patch.progress_note = body.progress_note;
    if (body && 'admin_notes' in body) patch.admin_notes = body.admin_notes;

    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgPatch(url, serviceKey, 'client_projects', eq('id', id), patch);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (!rows[0]) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ project: mapClientProject(rows[0]) });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
