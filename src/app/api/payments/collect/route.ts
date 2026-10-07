import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { pgInsertRow } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import { AuthError, requireFirebaseUser } from '../../../../server/requireAuth';
import { hostedCheckoutConfigured } from '../../../../server/hostedCheckoutGateway';
import { attachHostedCheckoutToOrder } from '../../../../server/orderHostedCheckout';
import { paytotaConfigured, publicPaymentError, requireUgMobile } from '../../../../server/paytotaGateway';
import { attachPaytotaToOrder } from '../../../../server/orderPaytota';

export const runtime = 'nodejs';

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 50_000_000;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const { url, serviceKey } = requireSupabaseService();
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      email?: string;
      phone?: string;
      amount?: number;
      purpose?: string;
      method?: 'mobile_money' | 'card';
    } | null;

    const name = body?.name?.trim() || '';
    const email = body?.email?.trim().toLowerCase() || '';
    const phone = body?.phone?.trim() || '';
    const purpose = (body?.purpose?.trim() || 'Payment').slice(0, 160);
    const method = body?.method === 'card' ? 'card' : body?.method === 'mobile_money' ? 'mobile_money' : '';
    const amount = Math.round(Number(body?.amount));

    if (!name || name.length > 120) {
      return NextResponse.json({ error: 'Enter the name on the payment.' }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Enter an amount between ${MIN_AMOUNT.toLocaleString('en-UG')} and ${MAX_AMOUNT.toLocaleString('en-UG')} UGX.` },
        { status: 400 },
      );
    }
    if (!method) {
      return NextResponse.json({ error: 'Choose mobile money or card.' }, { status: 400 });
    }

    let payerPhone = phone;
    if (method === 'mobile_money') {
      if (!paytotaConfigured()) {
        return NextResponse.json({ error: 'Mobile money is not available right now.' }, { status: 503 });
      }
      try {
        payerPhone = requireUgMobile(phone);
      } catch (e) {
        return NextResponse.json(
          { error: publicPaymentError(e, 'Enter a valid Uganda mobile number (MTN or Airtel).') },
          { status: 400 },
        );
      }
    } else if (!hostedCheckoutConfigured()) {
      return NextResponse.json({ error: 'Card payment is not available right now.' }, { status: 503 });
    } else if (phone.replace(/[^\d]/g, '').length < 9) {
      return NextResponse.json({ error: 'Enter a phone number we can reach you on.' }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const user = await requireFirebaseUser(req);
      if (user.email && user.email.toLowerCase() === email) userId = user.uid;
    } catch (e) {
      if (!(e instanceof AuthError)) throw e;
    }

    const statusToken = randomUUID();
    const { row, error } = await pgInsertRow(url, serviceKey, 'orders', {
      customer_name: name,
      customer_email: email,
      customer_phone: payerPhone,
      shipping_address: 'Not applicable',
      city: 'Kampala',
      country: 'Uganda',
      payment_method: method === 'card' ? 'dpo' : 'mobile_money',
      payment_status: 'pending',
      payment_reference: null,
      order_status: 'pending',
      status_token: statusToken,
      total_amount: amount,
      shipping_fee: 0,
      user_id: userId,
      notes: purpose,
      items: [
        {
          product_name: purpose,
          product_price: amount,
          quantity: 1,
          subtotal: amount,
          category: 'collection',
        },
      ],
    });

    if (error || !row) {
      return NextResponse.json({ error: error || 'Could not start the payment.' }, { status: 400 });
    }

    const orderNumber = row.order_number != null ? String(row.order_number) : '';
    if (!orderNumber) {
      return NextResponse.json({ error: 'Payment was saved but could not be started.' }, { status: 500 });
    }

    if (method === 'card') {
      const hostedCheckoutUrl = await attachHostedCheckoutToOrder(url, serviceKey, row, purpose);
      return NextResponse.json({ orderNumber, statusToken, hostedCheckoutUrl });
    }

    await attachPaytotaToOrder({
      supabaseUrl: url,
      serviceKey,
      order: row,
      productName: purpose,
    });

    return NextResponse.json({ orderNumber, statusToken, awaitingPhonePrompt: true });
  } catch (e) {
    console.error('[payments/collect]', e);
    const message = publicPaymentError(e, 'Could not start the payment. Please try again.');
    const safe = /gateway http|3gdirectpay|not configured/i.test(message)
      ? 'Could not start the payment. Please try again.'
      : message;
    return NextResponse.json({ error: safe }, { status: 502 });
  }
}
