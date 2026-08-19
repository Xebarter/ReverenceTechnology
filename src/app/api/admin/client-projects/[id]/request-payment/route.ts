import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { authErrorResponse, requireAdmin } from '../../../../../../server/requireAuth';
import { eq, pgInsertRow, pgSelect } from '../../../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../../../server/supabaseEnv';
import { mapClientProject, mapInstallment, remainingBalance } from '../../../../../../server/clientProjects';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function projectId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    await requireAdmin(req);
    const id = await projectId(context);
    const body = (await req.json().catch(() => null)) as { amount?: number; note?: string } | null;
    const amount = Number(body?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }

    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(url, serviceKey, 'client_projects', eq('id', id), '*');
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (!rows[0]) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const project = mapClientProject(rows[0]);
    if (project.agreed_total == null) {
      return NextResponse.json({ error: 'Set an agreed total before requesting payment' }, { status: 409 });
    }
    const remaining = remainingBalance(project) ?? 0;
    if (amount > remaining + 0.009) {
      return NextResponse.json(
        { error: `Amount cannot exceed the remaining balance (${remaining})` },
        { status: 409 },
      );
    }

    const { row, error: insertError } = await pgInsertRow(url, serviceKey, 'payment_installments', {
      client_project_id: id,
      amount,
      kind: 'installment',
      status: 'requested',
      status_token: randomUUID(),
      note: body?.note?.trim() || null,
    });
    if (insertError || !row) {
      return NextResponse.json({ error: insertError || 'Could not create payment request' }, { status: 400 });
    }

    return NextResponse.json({ installment: mapInstallment(row) }, { status: 201 });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
