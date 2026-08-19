import { NextResponse } from 'next/server';
import { extractTransactionTokenFromPayload } from '../../../../../server/hostedCheckoutGateway';
import { tryFinalizeHostedPaymentByTransactionToken } from '../../../../../server/orderHostedCheckout';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const raw = await req.text().catch(() => '');
  const url = new URL(req.url);
  const token = extractTransactionTokenFromPayload(url.searchParams, raw);

  if (token && supabaseUrl && serviceRoleKey) {
    await tryFinalizeHostedPaymentByTransactionToken(supabaseUrl, serviceRoleKey, token);
  }

  return new NextResponse('OK', { status: 200 });
}

export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
