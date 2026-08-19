import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { authErrorResponse, requireFirebaseUser } from '../../../../../server/requireAuth';
import { eq, pgInsertRow, pgSelect } from '../../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../../server/supabaseEnv';
import { hostedCheckoutConfigured } from '../../../../../server/hostedCheckoutGateway';
import { attachHostedCheckoutToInstallment } from '../../../../../server/orderHostedCheckout';
import { paytotaConfigured } from '../../../../../server/paytotaGateway';
import { attachPaytotaToInstallment } from '../../../../../server/orderPaytota';
import { mapClientProject, remainingBalance } from '../../../../../server/clientProjects';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function projectId(context: RouteContext) {
  const { id } = await context.params;
  return id;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await requireFirebaseUser(req);
    const id = await projectId(context);
    const body = (await req.json().catch(() => null)) as {
      installmentId?: string;
      kind?: 'balance' | 'installment';
      method?: 'card' | 'mobile_money';
    } | null;

    const { url, serviceKey } = requireSupabaseService();
    const { rows, error } = await pgSelect(url, serviceKey, 'client_projects', eq('id', id), '*');
    if (error) return NextResponse.json({ error }, { status: 400 });
    const row = rows[0];
    if (!row || String(row.user_id) !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const project = mapClientProject(row);
    if (project.status === 'cancelled') {
      return NextResponse.json({ error: 'This project is cancelled' }, { status: 409 });
    }

    let installmentId = body?.installmentId?.trim() || '';
    let amount = 0;
    let kind: 'installment' | 'balance' = 'installment';

    if (installmentId) {
      const { rows: instRows } = await pgSelect(
        url,
        serviceKey,
        'payment_installments',
        eq('id', installmentId),
        '*',
      );
      const inst = instRows[0];
      if (!inst || String(inst.client_project_id) !== id) {
        return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
      }
      if (String(inst.status) === 'paid') {
        return NextResponse.json({ error: 'This installment is already paid' }, { status: 409 });
      }
      if (String(inst.status) === 'cancelled') {
        return NextResponse.json({ error: 'This installment was cancelled' }, { status: 409 });
      }
      amount = Number(inst.amount);
      kind = String(inst.kind) === 'balance' ? 'balance' : 'installment';
    } else if (body?.kind === 'balance') {
      const remaining = remainingBalance(project);
      if (remaining == null) {
        return NextResponse.json({ error: 'The project total has not been set yet' }, { status: 409 });
      }
      if (remaining <= 0) {
        return NextResponse.json({ error: 'This project is already paid in full' }, { status: 409 });
      }
      amount = remaining;
      kind = 'balance';
      const { row: created, error: insertError } = await pgInsertRow(url, serviceKey, 'payment_installments', {
        client_project_id: id,
        amount,
        kind,
        status: 'requested',
        status_token: randomUUID(),
        note: 'Pay remaining balance',
      });
      if (insertError || !created) {
        return NextResponse.json({ error: insertError || 'Could not start payment' }, { status: 400 });
      }
      installmentId = String(created.id);
    } else {
      return NextResponse.json({ error: 'Choose an installment or pay the remaining balance' }, { status: 400 });
    }

    const method = body?.method === 'mobile_money' ? 'mobile_money' : 'card';

    if (method === 'card') {
      if (!hostedCheckoutConfigured()) {
        return NextResponse.json({ error: 'Card checkout is not configured' }, { status: 503 });
      }
      const hostedCheckoutUrl = await attachHostedCheckoutToInstallment({
        supabaseUrl: url,
        serviceKey,
        installmentId,
        amount,
        companyRef: `INST-${installmentId.slice(0, 8)}`,
        customerName: project.customer_name || user.name || user.email || 'Customer',
        customerEmail: project.customer_email || user.email || '',
        serviceDescription: `${kind === 'balance' ? 'Balance' : 'Installment'} · ${project.title}`.slice(0, 120),
      });
      return NextResponse.json({ hostedCheckoutUrl, installmentId });
    }

    if (!paytotaConfigured()) {
      return NextResponse.json({ error: 'Mobile money checkout is not configured' }, { status: 503 });
    }

    const mm = await attachPaytotaToInstallment({
      supabaseUrl: url,
      serviceKey,
      installmentId,
      amount,
      reference: `inst:${installmentId}`,
      customerName: project.customer_name || user.name || user.email || 'Customer',
      customerEmail: project.customer_email || user.email || '',
      customerPhone: project.customer_phone,
      productName: `${kind === 'balance' ? 'Balance' : 'Installment'} · ${project.title}`.slice(0, 120),
    });

    return NextResponse.json({
      installmentId,
      checkoutUrl: mm.checkoutUrl,
      awaitingPhonePrompt: mm.stkSent,
    });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
