import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../server/requireAuth';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import {
  createDisbursement,
  disbursementHttpError,
  disbursementsConfigured,
  listDisbursements,
} from '../../../../server/disbursements';
import type { Disbursement, DisbursementType } from '../../../../lib/disbursements';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    if (!disbursementsConfigured()) {
      return NextResponse.json({ error: 'Paytota is not configured.' }, { status: 503 });
    }
    const { url, serviceKey } = requireSupabaseService();
    const disbursements = await listDisbursements(url, serviceKey);
    return NextResponse.json({ disbursements });
  } catch (e) {
    console.error('[disbursements] list failed', e instanceof Error ? e.message : e);
    const { body, status } = disbursementHttpError(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!disbursementsConfigured()) {
      return NextResponse.json({ error: 'Paytota is not configured.' }, { status: 503 });
    }
    const body = (await req.json().catch(() => null)) as {
      payout_type?: DisbursementType;
      amount?: number;
      description?: string;
      recipient_name?: string;
      recipient_email?: string;
      recipient_phone?: string;
      bank_name?: string;
      bank_code?: string;
      bank_account_name?: string;
      bank_account_number?: string;
    } | null;
    const payoutType = body?.payout_type === 'bank' ? 'bank' : body?.payout_type === 'mobile' ? 'mobile' : null;
    if (!payoutType) return NextResponse.json({ error: 'Choose mobile money or bank.' }, { status: 400 });

    const { url, serviceKey } = requireSupabaseService();
    try {
      const disbursement = await createDisbursement(url, serviceKey, {
        payoutType,
        amount: Number(body?.amount),
        description: body?.description || '',
        recipientName: body?.recipient_name || '',
        recipientEmail: body?.recipient_email || '',
        recipientPhone: body?.recipient_phone || '',
        bankName: body?.bank_name,
        bankCode: body?.bank_code,
        bankAccountName: body?.bank_account_name,
        bankAccountNumber: body?.bank_account_number,
        createdBy: admin.uid,
      });
      return NextResponse.json({ disbursement }, { status: 201 });
    } catch (error) {
      const recorded = (error as { disbursement?: Disbursement }).disbursement;
      const message = error instanceof Error ? error.message : 'Could not send the disbursement.';
      return NextResponse.json({ error: message, disbursement: recorded || null }, { status: recorded ? 422 : 400 });
    }
  } catch (e) {
    const { body, status } = disbursementHttpError(e);
    return NextResponse.json(body, { status });
  }
}
