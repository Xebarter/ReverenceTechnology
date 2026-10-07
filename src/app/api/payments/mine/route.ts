import { NextResponse } from 'next/server';
import { authErrorResponse, requireFirebaseUser } from '../../../../server/requireAuth';
import { eq, pgSelect } from '../../../../server/supabasePostgrest';
import { requireSupabaseService } from '../../../../server/supabaseEnv';
import { claimOrdersForEmail } from '../../../../server/claimOrders';
import { purchaseIdFromToken, paytotaConfigured } from '../../../../server/paytotaGateway';
import { finalizePaytotaByPurchaseId } from '../../../../server/orderPaytota';
import { tryFinalizeHostedOrderByTransactionToken } from '../../../../server/orderHostedCheckout';

export const runtime = 'nodejs';

type PaymentRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  amount: number;
  status: string;
  method: 'mobile_money' | 'card';
  purpose: string;
};

function isCollection(items: unknown): boolean {
  return Array.isArray(items) && items.some((item) => item && typeof item === 'object' && (item as { category?: string }).category === 'collection');
}

function purposeOf(row: Record<string, unknown>): string {
  if (typeof row.notes === 'string' && row.notes.trim()) return row.notes.trim();
  const items = row.items;
  if (Array.isArray(items) && items[0] && typeof items[0] === 'object') {
    const name = (items[0] as { product_name?: string }).product_name;
    if (name?.trim()) return name.trim();
  }
  return 'Payment';
}

function toPayment(row: Record<string, unknown>): PaymentRow {
  const method = String(row.payment_method || '') === 'mobile_money' ? 'mobile_money' : 'card';
  return {
    id: String(row.id),
    orderNumber: String(row.order_number || ''),
    createdAt: String(row.created_at || ''),
    amount: Number(row.total_amount || 0),
    status: String(row.payment_status || 'pending'),
    method,
    purpose: purposeOf(row),
  };
}

export async function GET(req: Request) {
  try {
    const user = await requireFirebaseUser(req);
    const { url, serviceKey } = requireSupabaseService();
    if (user.email) await claimOrdersForEmail(user.uid, user.email);

    const fields = 'id,order_number,created_at,payment_status,payment_method,total_amount,notes,items,trans_token,user_id';
    const { rows, error } = await pgSelect(
      url,
      serviceKey,
      'orders',
      `${eq('user_id', user.uid)}&order=created_at.desc&limit=40`,
      fields,
    );
    if (error) return NextResponse.json({ error: 'Could not load payments.' }, { status: 500 });

    const collections = rows.filter((row) => isCollection(row.items));
    for (const row of collections) {
      if (String(row.payment_status || '') !== 'pending') continue;
      const token = row.trans_token != null ? String(row.trans_token) : '';
      if (!token) continue;
      try {
        if (String(row.payment_method) === 'mobile_money' && paytotaConfigured()) {
          const purchaseId = purchaseIdFromToken(token);
          if (purchaseId) await finalizePaytotaByPurchaseId(url, serviceKey, purchaseId);
        } else if (token && !token.startsWith('pt:')) {
          await tryFinalizeHostedOrderByTransactionToken(url, serviceKey, token);
        }
      } catch (e) {
        console.error('[payments/mine] status check failed', e);
      }
    }

    const refreshed = await pgSelect(
      url,
      serviceKey,
      'orders',
      `${eq('user_id', user.uid)}&order=created_at.desc&limit=40`,
      fields,
    );
    const source = refreshed.error ? collections : refreshed.rows.filter((row) => isCollection(row.items));

    return NextResponse.json({ payments: source.map(toPayment) });
  } catch (e) {
    const { body, status } = authErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
