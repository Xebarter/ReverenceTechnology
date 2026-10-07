import { NextResponse } from 'next/server';
import { getPublicAppBaseUrl } from './appBaseUrl';
import { parsePaytotaWebhook, verifyPaytotaWebhookSignature } from './paytotaGateway';
import { finalizePaytotaByOurReference, finalizePaytotaByPurchaseId } from './orderPaytota';

function resolvePublicBase(req: Request): string {
  try {
    return getPublicAppBaseUrl();
  } catch {
    return new URL(req.url).origin;
  }
}

function redirectFor(
  base: string,
  result:
    | { kind: 'installment'; projectId: string; statusToken: string }
    | { kind: 'order'; orderNumber: string; statusToken: string }
    | null,
  fallback: string,
): NextResponse {
  if (!result) return NextResponse.redirect(fallback);
  if (result.kind === 'installment') {
    return NextResponse.redirect(
      `${base}/dashboard/projects/${encodeURIComponent(result.projectId)}?payment=1`,
    );
  }
  return NextResponse.redirect(
    `${base}/payment-result?order=${encodeURIComponent(result.orderNumber)}&t=${encodeURIComponent(result.statusToken)}`,
  );
}

export async function mobileMoneyReturnResponse(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const ref = (url.searchParams.get('ref') || '').trim();
  const purchaseId = (url.searchParams.get('pid') || url.searchParams.get('id') || '').trim();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = resolvePublicBase(req);
  const fallback = `${base}/orders`;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.redirect(fallback);
  }

  if (purchaseId) {
    const result = await finalizePaytotaByPurchaseId(supabaseUrl, serviceRoleKey, purchaseId);
    return redirectFor(base, result, fallback);
  }

  if (!ref) {
    return NextResponse.redirect(fallback);
  }

  const result = await finalizePaytotaByOurReference(supabaseUrl, serviceRoleKey, ref);
  return redirectFor(base, result, fallback);
}

export async function mobileMoneyWebhookResponse(req: Request): Promise<NextResponse> {
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
