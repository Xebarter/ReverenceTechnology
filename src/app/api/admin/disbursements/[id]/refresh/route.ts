import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../server/requireAuth';
import { requireSupabaseService } from '../../../../../../server/supabaseEnv';
import { disbursementHttpError, disbursementsConfigured, refreshDisbursement } from '../../../../../../server/disbursements';

export const runtime = 'nodejs';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    if (!disbursementsConfigured()) {
      return NextResponse.json({ error: 'Paytota is not configured.' }, { status: 503 });
    }
    const { id } = await context.params;
    const { url, serviceKey } = requireSupabaseService();
    const disbursement = await refreshDisbursement(url, serviceKey, id);
    return NextResponse.json({ disbursement });
  } catch (e) {
    const { body, status } = disbursementHttpError(e);
    return NextResponse.json(body, { status });
  }
}
