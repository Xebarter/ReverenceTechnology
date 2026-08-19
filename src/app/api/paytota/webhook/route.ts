import { NextResponse } from 'next/server';
import { parsePaytotaWebhook, verifyPaytotaWebhookSignature } from '../../../../server/paytotaGateway';
import { finalizePaytotaByPurchaseId } from '../../../../server/orderPaytota';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const raw = await req.text().catch(() => '');
  const signature = req.headers.get('x-signature') || req.headers.get('X-Signature');

  if (!verifyPaytotaWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parsePaytotaWebhook(body);
  if (!parsed.purchaseId) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server is not configured' }, { status: 500 });
  }

  await finalizePaytotaByPurchaseId(
    supabaseUrl,
    serviceRoleKey,
    parsed.purchaseId,
    parsed.status,
    parsed.reference,
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
