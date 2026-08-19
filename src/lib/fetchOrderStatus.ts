import { supabase } from './supabase';

export type OrderStatusSnapshot = {
  payment_status: 'paid' | 'failed' | 'pending' | 'refunded' | null;
  payment_reference: string | null;
  order_status: string | null;
};

type ApiOk = OrderStatusSnapshot;
type ApiErr = { error?: string };

function isProbablyMissingApiRoute(resp: Response): boolean {
  return resp.status === 404 || resp.status === 405;
}

async function fetchViaApi(orderNumber: string, token: string): Promise<OrderStatusSnapshot> {
  const resp = await fetch(
    `/api/orders/status?order=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );

  const json = (await resp.json().catch(() => null)) as (ApiOk & ApiErr) | null;

  if (!resp.ok) {
    if (isProbablyMissingApiRoute(resp)) {
      throw new Error('__STATUS_FALLBACK_TO_EDGE_FUNCTION__');
    }
    throw new Error(json?.error || `Failed to fetch order status (HTTP ${resp.status})`);
  }

  return {
    payment_status: (json?.payment_status as OrderStatusSnapshot['payment_status']) ?? null,
    payment_reference: (json?.payment_reference as string | null) ?? null,
    order_status: (json?.order_status as string | null) ?? null,
  };
}

async function fetchViaEdgeFunction(orderNumber: string, token: string): Promise<OrderStatusSnapshot> {
  const { data, error } = await supabase.functions.invoke('get-order-status', {
    body: { orderNumber, token },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch order status');
  }

  return {
    payment_status: ((data as any)?.payment_status as OrderStatusSnapshot['payment_status']) ?? null,
    payment_reference: ((data as any)?.payment_reference as string | null) ?? null,
    order_status: ((data as any)?.order_status as string | null) ?? null,
  };
}

export async function fetchOrderStatus(orderNumber: string, token: string): Promise<OrderStatusSnapshot> {
  try {
    return await fetchViaApi(orderNumber, token);
  } catch (e) {
    if (e instanceof Error && e.message === '__STATUS_FALLBACK_TO_EDGE_FUNCTION__') {
      return await fetchViaEdgeFunction(orderNumber, token);
    }
    if (process.env.NODE_ENV === 'development') {
      try {
        return await fetchViaEdgeFunction(orderNumber, token);
      } catch {
        throw e;
      }
    }
    throw e;
  }
}
