import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../server/requireAuth';
import { disbursementHttpError, disbursementsConfigured, readPaytotaBalances } from '../../../../../server/disbursements';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    if (!disbursementsConfigured()) {
      return NextResponse.json({ error: 'Paytota is not configured.' }, { status: 503 });
    }
    const balances = await readPaytotaBalances();
    return NextResponse.json({ balances });
  } catch (e) {
    const { body, status } = disbursementHttpError(e);
    return NextResponse.json(body, { status });
  }
}
