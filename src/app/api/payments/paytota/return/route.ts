import { NextResponse } from 'next/server';
import { getPublicAppBaseUrl } from '../../../../../server/appBaseUrl';
import { finalizePaytotaByOurReference, finalizePaytotaByPurchaseId } from '../../../../../server/orderPaytota';

export const runtime = 'nodejs';

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

export async function GET(req: Request) {
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
