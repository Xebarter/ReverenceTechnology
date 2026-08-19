import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { pgInsertRow } from '../../../../server/supabasePostgrest';
import { hostedCheckoutConfigured } from '../../../../server/hostedCheckoutGateway';
import { attachHostedCheckoutToOrder, orderDescriptionFromRow } from '../../../../server/orderHostedCheckout';
import { paytotaConfigured } from '../../../../server/paytotaGateway';
import { attachPaytotaToOrder } from '../../../../server/orderPaytota';

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
  startHostedCheckout?: boolean;
  startMobileMoney?: boolean;
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

    const startHosted = body?.startHostedCheckout === true;
    const startMobileMoney = body?.startMobileMoney === true;
    if (startHosted && !hostedCheckoutConfigured()) {
      return NextResponse.json(
        { error: 'Card payment is not available right now. Choose mobile money or try again later.' },
        { status: 503, headers: corsHeaders() },
      );
    }
    if (startMobileMoney && !paytotaConfigured()) {
      return NextResponse.json(
        { error: 'Mobile money is not available right now. Pay by card or try again later.' },
        { status: 503, headers: corsHeaders() },
      );
    }

    const statusToken = randomUUID();
    const orderPayload: Record<string, unknown> = {
      ...order,
      status_token: statusToken,
      ...(startHosted ? { payment_method: 'dpo', payment_reference: null } : {}),
      ...(startMobileMoney ? { payment_method: 'mobile_money', payment_reference: null } : {}),
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
    let mobileMoneyCheckoutUrl: string | undefined;
    let awaitingPhonePrompt = false;
    const description = orderDescriptionFromRow(inserted as Record<string, unknown>);
    if (startHosted) {
      try {
        hostedCheckoutUrl = await attachHostedCheckoutToOrder(
          supabaseUrl,
          serviceRoleKey,
          inserted as Record<string, unknown>,
          description,
        );
      } catch (e) {
        console.error('[orders/create-service-order] hosted session failed', e);
        return NextResponse.json(
          {
            error:
              e instanceof Error ? e.message : 'Could not start card payment. Your order was saved; contact us or try again.',
            orderNumber,
            statusToken,
          },
          { status: 502, headers: corsHeaders() },
        );
      }
    }
    if (startMobileMoney) {
      try {
        const mm = await attachPaytotaToOrder({
          supabaseUrl,
          serviceKey: serviceRoleKey,
          order: inserted as Record<string, unknown>,
          productName: description,
        });
        mobileMoneyCheckoutUrl = mm.checkoutUrl || undefined;
        awaitingPhonePrompt = mm.stkSent;
      } catch (e) {
        console.error('[orders/create-service-order] paytota session failed', e);
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : 'Could not start mobile money. Your order was saved; contact us or try again.',
            orderNumber,
            statusToken,
          },
          { status: 502, headers: corsHeaders() },
        );
      }
    }

    return NextResponse.json(
      { orderNumber, statusToken, hostedCheckoutUrl, mobileMoneyCheckoutUrl, awaitingPhonePrompt },
      { status: 200, headers: corsHeaders() },
    );
  } catch (e) {
    console.error('[orders/create-service-order] fatal', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
