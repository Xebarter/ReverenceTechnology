import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { pgInsertRow } from '../../../../server/supabasePostgrest';
import { hostedCheckoutConfigured } from '../../../../server/hostedCheckoutGateway';
import { attachHostedCheckoutToOrder, orderDescriptionFromRow } from '../../../../server/orderHostedCheckout';

export const runtime = 'nodejs';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  } as const;
}

export function OPTIONS() {
  return new NextResponse('ok', { status: 200, headers: corsHeaders() });
}

type Body = {
  order: Record<string, unknown>;
  /** When true and gateway env is set, returns hostedCheckoutUrl for redirect. */
  startHostedCheckout?: boolean;
};

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500, headers: corsHeaders() },
      );
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders() });
    }

    const order = body?.order;
    if (!order || typeof order !== 'object') {
      return NextResponse.json({ error: 'Missing order payload' }, { status: 400, headers: corsHeaders() });
    }

    const startHosted = body?.startHostedCheckout === true && hostedCheckoutConfigured();

    const statusToken = randomUUID();
    const orderPayload: Record<string, unknown> = {
      ...order,
      status_token: statusToken,
      ...(startHosted ? { payment_method: 'dpo', payment_reference: null } : {}),
    };

    const { row: inserted, error: insertError } = await pgInsertRow(
      supabaseUrl,
      serviceRoleKey,
      'orders',
      orderPayload,
    );

    if (insertError) {
      return NextResponse.json({ error: insertError }, { status: 400, headers: corsHeaders() });
    }

    const orderNumber = inserted?.order_number != null ? String(inserted.order_number) : '';
    const orderId = inserted?.id != null ? String(inserted.id) : '';
    if (!orderNumber || !orderId) {
      return NextResponse.json({ error: 'Order created but missing id/order_number' }, { status: 500, headers: corsHeaders() });
    }

    let hostedCheckoutUrl: string | undefined;
    if (startHosted) {
      try {
        hostedCheckoutUrl = await attachHostedCheckoutToOrder(
          supabaseUrl,
          serviceRoleKey,
          inserted as Record<string, unknown>,
          orderDescriptionFromRow(inserted as Record<string, unknown>),
        );
      } catch (e) {
        console.error('[orders/create-service-order] hosted session failed', e);
        return NextResponse.json(
          {
            error:
              e instanceof Error ? e.message : 'Could not start secure payment. Your order was saved; contact us or try again.',
            orderNumber,
            statusToken,
          },
          { status: 502, headers: corsHeaders() },
        );
      }
    }

    return NextResponse.json({ orderNumber, statusToken, hostedCheckoutUrl }, { status: 200, headers: corsHeaders() });
  } catch (e) {
    console.error('[orders/create-service-order] fatal', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
