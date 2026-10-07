import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser } from '../../../../server/requireAuth';
import { eq, pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import { mapClientProject, mapInstallment } from '../../../../server/clientProjects';
import { reconcileInstallmentRows } from '../../../../server/orderPaytota';

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

    const installmentQuery = `${eq('client_project_id', id)}&order=requested_at.desc`;
    let { rows: payments } = await pgSelect(url, serviceKey, 'payment_installments', installmentQuery, '*');

    const failedIds = await reconcileInstallmentRows(url, serviceKey, payments);
    let projectRow = row;
    if (failedIds.length > 0 || payments.some((p) => p.trans_token && String(p.status) === 'requested')) {
      const refreshed = await pgSelect(url, serviceKey, 'client_projects', eq('id', id), '*');
      if (refreshed.rows[0]) projectRow = refreshed.rows[0];
      const paymentsAgain = await pgSelect(url, serviceKey, 'payment_installments', installmentQuery, '*');
      if (!paymentsAgain.error) payments = paymentsAgain.rows;
    }

    return NextResponse.json({
      project: mapClientProject(projectRow),
      installments: payments.map(mapInstallment),
      mobileMoney: { failedIds },
    });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
