import { createPublicKey, createVerify } from 'crypto';

export type PaytotaPaymentStatus = 'paid' | 'failed' | 'pending';

export type PaytotaPurchase = {
  id: string;
  status: string;
  checkout_url?: string | null;
  reference?: string | null;
  reference_generated?: string | null;
  event_type?: string | null;
};

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export function paytotaConfigured(): boolean {
  return Boolean(
    process.env.PAYTOTA_SECRET_KEY?.trim() &&
      process.env.PAYTOTA_BRAND_ID?.trim() &&
      (process.env.PAYTOTA_BASE_URL?.trim() || 'https://gate.paytota.com'),
  );
}

export function paytotaBaseUrl(): string {
  return trimSlash(process.env.PAYTOTA_BASE_URL?.trim() || 'https://gate.paytota.com');
}

function secretKey(): string {
  const key = process.env.PAYTOTA_SECRET_KEY?.trim();
  if (!key) throw new Error('Paytota is not configured');
  return key;
}

function brandId(): string {
  const id = process.env.PAYTOTA_BRAND_ID?.trim();
  if (!id) throw new Error('Paytota is not configured');
  return id;
}

export function paytotaToken(purchaseId: string): string {
  return `pt:${purchaseId}`;
}

export function purchaseIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return token.startsWith('pt:') ? token.slice(3) : null;
}

/** Normalize a Uganda mobile number to 256XXXXXXXXX. */
export function toPaytotaUgPhone(phone: string): string {
  const d = phone.replace(/[^\d]/g, '');
  if (d.startsWith('256') && d.length >= 12) return d.slice(0, 12);
  if (d.startsWith('0') && d.length >= 10) return `256${d.slice(1, 10)}`;
  if (d.length === 9) return `256${d}`;
  return d;
}

export function mapPaytotaStatus(status: string | null | undefined): PaytotaPaymentStatus {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'paid';
  if (
    s === 'error' ||
    s === 'cancelled' ||
    s === 'expired' ||
    s === 'chargeback' ||
    s === 'charged_back' ||
    s === 'refunded'
  ) {
    return 'failed';
  }
  return 'pending';
}

async function paytotaJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${paytotaBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      Accept: 'application/json',
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : text.slice(0, 240) || `Paytota HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function createPaytotaPurchase(input: {
  amount: number;
  currency?: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  productName: string;
  reference: string;
  successRedirect: string;
  failureRedirect: string;
  cancelRedirect?: string;
}): Promise<PaytotaPurchase> {
  const currency = input.currency || process.env.HOSTED_CHECKOUT_CURRENCY?.trim() || 'UGX';
  const phone = input.phone ? toPaytotaUgPhone(input.phone) : '';
  const payload = {
    client: {
      email: input.email,
      country: 'UG',
      ...(phone ? { phone } : {}),
      ...(input.name?.trim() ? { full_name: input.name.trim() } : {}),
    },
    purchase: {
      currency,
      products: [
        {
          name: input.productName.slice(0, 120) || 'Payment',
          price: String(Math.round(input.amount)),
        },
      ],
    },
    reference: input.reference,
    skip_capture: false,
    brand_id: brandId(),
    success_redirect: input.successRedirect,
    failure_redirect: input.failureRedirect,
    cancel_redirect: input.cancelRedirect || input.failureRedirect,
  };

  const created = await paytotaJson<PaytotaPurchase>('/api/v1/purchases/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!created?.id) throw new Error('Paytota did not return a purchase id');
  return created;
}

export async function executePaytotaStk(purchaseId: string): Promise<void> {
  const form = new FormData();
  form.append('s2s', 'true');
  form.append('pm', 'paytota_proxy');

  const res = await fetch(`${paytotaBaseUrl()}/p/${encodeURIComponent(purchaseId)}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
    },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text.slice(0, 240) || `Paytota STK HTTP ${res.status}`);
  }
}

export async function getPaytotaPurchase(purchaseId: string): Promise<PaytotaPurchase> {
  return paytotaJson<PaytotaPurchase>(`/api/v1/purchases/${encodeURIComponent(purchaseId)}/`);
}

export function normalizePem(raw: string): string {
  return raw
    .trim()
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}

export function verifyPaytotaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const pem = process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY?.trim();
  if (!pem) {
    console.error('[paytota] PAYTOTA_WEBHOOK_PUBLIC_KEY is not set');
    return false;
  }
  if (!signatureHeader?.trim()) return false;
  try {
    const key = createPublicKey(normalizePem(pem));
    const verifier = createVerify('SHA256');
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(key, Buffer.from(signatureHeader.trim(), 'base64'));
  } catch (e) {
    console.error('[paytota] signature verify failed', e);
    return false;
  }
}

export function parsePaytotaWebhook(body: unknown): {
  purchaseId: string | null;
  status: PaytotaPaymentStatus;
  reference: string | null;
} {
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const purchase =
    obj.purchase && typeof obj.purchase === 'object' ? (obj.purchase as Record<string, unknown>) : obj;
  const id =
    (typeof obj.id === 'string' && obj.id) ||
    (typeof purchase.id === 'string' && purchase.id) ||
    null;
  const event = typeof obj.event_type === 'string' ? obj.event_type : '';
  const rawStatus = typeof obj.status === 'string' ? obj.status : typeof purchase.status === 'string' ? purchase.status : '';
  let status = mapPaytotaStatus(rawStatus);
  if (event === 'purchase.paid') status = 'paid';
  if (event === 'purchase.payment_failure' || event === 'purchase.cancelled') status = 'failed';
  const reference =
    (typeof obj.reference_generated === 'string' && obj.reference_generated) ||
    (typeof obj.reference === 'string' && obj.reference) ||
    id;
  return { purchaseId: id, status, reference };
}
