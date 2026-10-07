import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { AuthError, authErrorResponse, requireFirebaseUser } from '../../../../../server/requireAuth';
import { eq, pgInsertRow, pgPatch, pgSelect } from '../../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../../server/supabaseEnv';
import { hostedCheckoutConfigured } from '../../../../../server/hostedCheckoutGateway';
import { attachHostedCheckoutToInstallment } from '../../../../../server/orderHostedCheckout';
import { paytotaConfigured, publicPaymentError, requireUgMobile } from '../../../../../server/paytotaGateway';
import { attachPaytotaToInstallment } from '../../../../../server/orderPaytota';
import { formatUgx } from '../../../../../lib/projectMoney';
import {
  depositCeiling,
  isReplaceableCheckout,
  minimumDeposit,
} from '../../../../../lib/projectProgress';
import { mapClientProject, mapInstallment, remainingBalance } from '../../../../../server/clientProjects';

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
      kind?: 'balance' | 'deposit' | 'installment';
      amount?: number;
      method?: 'card' | 'mobile_money';
      phone?: string;
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
    let chargeLabel: 'Balance' | 'Deposit' | 'Installment' = 'Installment';

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
      const instNote = inst.note != null ? String(inst.note) : '';
      chargeLabel = kind === 'balance' ? 'Balance' : instNote === 'Deposit' ? 'Deposit' : 'Installment';
    } else if (body?.kind === 'balance' || body?.kind === 'deposit') {
      const remaining = remainingBalance(project);
      if (remaining == null) {
        return NextResponse.json({ error: 'The project total has not been set yet' }, { status: 409 });
      }
      if (remaining <= 0) {
        return NextResponse.json({ error: 'This project is already paid in full' }, { status: 409 });
      }

      const { rows: openRows, error: openError } = await pgSelect(
        url,
        serviceKey,
        'payment_installments',
        `${eq('client_project_id', id)}&status=eq.requested`,
        '*',
      );
      if (openError) return NextResponse.json({ error: openError }, { status: 400 });

      const open = openRows.map(mapInstallment);
      const available = depositCeiling(remaining, open);
      if (available <= 0) {
        return NextResponse.json(
          { error: 'A payment is already open for the remaining balance. Complete that payment first.' },
          { status: 409 },
        );
      }

      const requestedAmount = body.kind === 'deposit' ? Math.round(Number(body.amount)) : available;
      const min = minimumDeposit(available);
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return NextResponse.json({ error: 'Enter a valid deposit amount' }, { status: 400 });
      }
      if (requestedAmount > available) {
        return NextResponse.json(
          { error: `You can deposit up to ${formatUgx(available)} right now` },
          { status: 409 },
        );
      }
      if (requestedAmount < min) {
        return NextResponse.json({ error: `Minimum deposit is ${formatUgx(min)}` }, { status: 400 });
      }

      amount = requestedAmount;
      const coversProject = amount >= remaining - 0.5;
      kind = coversProject ? 'balance' : 'installment';
      chargeLabel = coversProject ? 'Balance' : 'Deposit';
      const note = coversProject ? 'Pay remaining balance' : 'Deposit';

      for (const item of open) {
        if (!isReplaceableCheckout(item)) continue;
        const cancelled = await pgPatch(url, serviceKey, 'payment_installments', eq('id', item.id), {
          status: 'cancelled',
        });
        if (cancelled.error) return NextResponse.json({ error: cancelled.error }, { status: 400 });
      }

      const { row: created, error: insertError } = await pgInsertRow(url, serviceKey, 'payment_installments', {
        client_project_id: id,
        amount,
        kind,
        status: 'requested',
        status_token: randomUUID(),
        note,
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
        serviceDescription: `${chargeLabel} · ${project.title}`.slice(0, 120),
      });
      return NextResponse.json({ hostedCheckoutUrl, installmentId });
    }

    if (!paytotaConfigured()) {
      return NextResponse.json({ error: 'Mobile money is not available right now.' }, { status: 503 });
    }

    let phone = '';
    try {
      phone = requireUgMobile(body?.phone || project.customer_phone || '');
    } catch (e) {
      return NextResponse.json(
        { error: publicPaymentError(e, 'Enter a valid Uganda mobile number (MTN or Airtel).') },
        { status: 400 },
      );
    }

    const mm = await attachPaytotaToInstallment({
      supabaseUrl: url,
      serviceKey,
      installmentId,
      amount,
      reference: `inst:${installmentId}`,
      customerName: project.customer_name || user.name || user.email || 'Customer',
      customerEmail: project.customer_email || user.email || '',
      customerPhone: phone,
      productName: `${chargeLabel} · ${project.title}`.slice(0, 120),
    });

    return NextResponse.json({
      installmentId,
      awaitingPhonePrompt: mm.stkSent,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const { body, status } = authErrorResponse(e);
      return NextResponse.json(body, { status });
    }
    console.error('[mobile-money] project pay failed', e);
    const message = publicPaymentError(e, 'Could not send the payment prompt. Check the number and try again.');
    const status = /valid Uganda|receive the prompt|not available/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
