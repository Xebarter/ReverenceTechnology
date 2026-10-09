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
  if (!key) throw new Error('Mobile money is not available right now.');
  return key;
}

function brandId(): string {
  const id = process.env.PAYTOTA_BRAND_ID?.trim();
  if (!id) throw new Error('Mobile money is not available right now.');
  return id;
}

/** Customer-facing copy must not include the gateway name. */
export function publicPaymentError(
  error: unknown,
  fallback = 'Mobile money could not be started. Please try again.',
): string {
  const raw = error instanceof Error ? error.message : '';
  if (!raw.trim() || /paytota/i.test(raw) || /\bdpo\b/i.test(raw)) return fallback;
  return raw.slice(0, 240);
}

function customerGatewayMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const obj = data as Record<string, unknown>;
  const direct = obj.message ?? obj.detail ?? obj.error;
  const text = Array.isArray(direct) ? direct.map(String).join(' ') : typeof direct === 'string' ? direct : '';
  const cleaned = text.replace(/paytota/gi, '').replace(/\s+/g, ' ').trim();
  if (!cleaned || /<\s*html|<\s*!doctype/i.test(cleaned)) return fallback;
  return cleaned.slice(0, 240);
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

export function requireUgMobile(phone: string): string {
  const n = toPaytotaUgPhone(phone);
  if (!/^256\d{9}$/.test(n)) {
    throw new Error('Enter a valid Uganda mobile number (MTN or Airtel).');
  }
  return n;
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
    throw new Error(
      customerGatewayMessage(
        data,
        res.status >= 500
          ? 'Mobile money is temporarily unavailable. Please try again.'
          : 'Could not start mobile money. Check the number and try again.',
      ),
    );
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
  const phone = input.phone ? requireUgMobile(input.phone) : '';
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
  if (!created?.id) throw new Error('Mobile money could not be started. Please try again.');
  return created;
}

export async function executePaytotaStk(purchaseId: string): Promise<void> {
  const form = new FormData();
  form.append('s2s', 'true');
  form.append('pm', 'paytota_proxy');

  const res = await fetch(`${paytotaBaseUrl()}/p/${encodeURIComponent(purchaseId)}/`, {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  const fallback = 'Could not send the payment prompt. Check the number and try again.';
  if (!res.ok || !data || typeof data !== 'object') {
    throw new Error(fallback);
  }
  const body = data as { status?: unknown; details?: { return_code?: unknown; message?: unknown } };
  const status = String(body.status || '').toLowerCase();
  const code = String(body.details?.return_code || '');
  if (status === 'pending' || code === '200') return;
  const detail = typeof body.details?.message === 'string' ? body.details.message : '';
  const cleaned = detail.replace(/paytota/gi, '').replace(/\s+/g, ' ').trim();
  throw new Error(cleaned || fallback);
}

export async function getPaytotaPurchase(purchaseId: string): Promise<PaytotaPurchase> {
  return paytotaJson<PaytotaPurchase>(`/api/v1/purchases/${encodeURIComponent(purchaseId)}/`);
}

export type PaytotaCurrencyBalance = {
  balance: number;
  fee_sell: number;
  reserved: number;
  gross_balance: number;
  payout_balance: number;
  payout_fee_sell: number;
  pending_payouts: number;
  payout_overdraft: number;
  pending_outgoing: number;
  available_balance: number;
  payout_gross_balance: number;
  available_payout_balance: number;
};

export type PaytotaPayoutStatus = 'initialized' | 'pending' | 'success' | 'error';

export type PaytotaPayout = {
  id: string;
  status: string;
  reference?: string | null;
  execution_url?: string | null;
  event_type?: string | null;
  transaction_data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function money(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function adminGatewayMessage(data: unknown, fallback: string): string {
  const obj = asRecord(data);
  const nested = asRecord(obj?.error);
  const nestedMessage = nested?.message;
  if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage.trim().slice(0, 240);
  return customerGatewayMessage(data, fallback);
}

async function paytotaAdminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${paytotaBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
    throw new Error(adminGatewayMessage(data, 'Paytota could not complete that request.'));
  }
  return data as T;
}

function mapBalance(raw: Record<string, unknown>): PaytotaCurrencyBalance {
  return {
    balance: money(raw.balance),
    fee_sell: money(raw.fee_sell),
    reserved: money(raw.reserved),
    gross_balance: money(raw.gross_balance),
    payout_balance: money(raw.payout_balance),
    payout_fee_sell: money(raw.payout_fee_sell),
    pending_payouts: money(raw.pending_payouts),
    payout_overdraft: money(raw.payout_overdraft),
    pending_outgoing: money(raw.pending_outgoing),
    available_balance: money(raw.available_balance),
    payout_gross_balance: money(raw.payout_gross_balance),
    available_payout_balance: money(raw.available_payout_balance),
  };
}

export async function getPaytotaAccountBalance(): Promise<Record<string, PaytotaCurrencyBalance>> {
  const data = await paytotaAdminJson<unknown>('/api/v1/account/json/balance/');
  const root = asRecord(data);
  if (!root) throw new Error('Paytota did not return an account balance.');
  const balances: Record<string, PaytotaCurrencyBalance> = {};
  for (const [key, value] of Object.entries(root)) {
    const row = asRecord(value);
    if (!row) continue;
    if (!('balance' in row) && !('available_balance' in row) && !('available_payout_balance' in row)) continue;
    balances[key] = mapBalance(row);
  }
  if (!Object.keys(balances).length) throw new Error('Paytota did not return an account balance.');
  return balances;
}

export function mapPaytotaPayoutStatus(
  status: string | null | undefined,
  eventType?: string | null,
): PaytotaPayoutStatus {
  const event = (eventType || '').toLowerCase();
  const value = (status || '').toLowerCase();
  if (event === 'payout.success' || value === 'success') return 'success';
  if (event === 'payout.failed' || value === 'error' || value === 'failed') return 'error';
  if (event === 'payout.pending' || value === 'pending') return 'pending';
  return 'initialized';
}

function pushText(parts: string[], value: unknown) {
  if (typeof value !== 'string') return;
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text || parts.includes(text) || /^failed\.?\s*\.?$/i.test(text)) return;
  parts.push(text);
}

/** Operator or gateway text from a payout status payload. */
export function payoutFailureMessage(payout: PaytotaPayout | null | undefined): string | null {
  const tx = asRecord(payout?.transaction_data);
  const webhook = asRecord(asRecord(tx?.extra)?.webhook_payload);
  const attempts = Array.isArray(tx?.attempts) ? tx.attempts : [];
  const parts: string[] = [];
  for (const attempt of attempts) {
    const row = asRecord(attempt);
    pushText(parts, asRecord(row?.error)?.message);
    pushText(parts, asRecord(asRecord(row?.extra)?.webhook_payload)?.message);
  }
  pushText(parts, webhook?.message);
  const message = parts.slice(0, 2).join('. ').slice(0, 240);
  return message || null;
}

export async function createPaytotaPayout(input: {
  email: string;
  phone: string;
  fullName?: string;
  bankAccount?: string;
  amount: number;
  currency?: string;
  description: string;
  reference: string;
}): Promise<PaytotaPayout> {
  const payload = {
    client: {
      email: input.email,
      phone: input.phone,
      country: 'UG',
      ...(input.fullName ? { full_name: input.fullName } : {}),
      ...(input.bankAccount ? { bank_account: input.bankAccount } : {}),
    },
    payment: {
      currency: input.currency || 'UGX',
      amount: String(Math.round(input.amount)),
      description: input.description,
    },
    reference: input.reference,
    brand_id: brandId(),
  };
  const created = await paytotaAdminJson<PaytotaPayout>('/api/v1/payouts/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!created?.id) throw new Error('Paytota did not return a payout id.');
  return created;
}

function assertPaytotaExecutionUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Paytota did not return a payout execution URL.');
  }
  const base = new URL(paytotaBaseUrl());
  if (url.protocol !== 'https:' || url.host !== base.host) {
    throw new Error('Paytota returned an unexpected payout URL.');
  }
  return url.toString();
}

export async function executePaytotaPayout(
  executionUrl: string,
  payload: Record<string, string>,
): Promise<{ status: PaytotaPayoutStatus; message: string | null }> {
  const res = await fetch(assertPaytotaExecutionUrl(executionUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  const body = asRecord(data);
  const status = String(body?.status || '').toLowerCase();
  const details = asRecord(body?.details);
  const transaction = asRecord(details?.transaction);
  const txStatus = String(transaction?.status || '').toLowerCase();
  const detail = typeof details?.message === 'string' ? details.message.trim() : '';
  const failed = !res.ok || status === 'error' || txStatus === 'failed' || txStatus === 'error';
  if (failed) {
    throw new Error(detail || adminGatewayMessage(data, 'Paytota could not send this disbursement.'));
  }
  if (status === 'pending' || status === 'success' || String(details?.return_code || '') === '200') {
    return { status: status === 'success' ? 'success' : 'pending', message: null };
  }
  throw new Error(detail || 'Paytota could not send this disbursement.');
}

export async function getPaytotaPayout(payoutId: string): Promise<PaytotaPayout> {
  return paytotaAdminJson<PaytotaPayout>(`/api/v1/payouts/${encodeURIComponent(payoutId)}/`);
}

export function parsePaytotaPayoutWebhook(body: unknown): {
  isPayout: boolean;
  payoutId: string | null;
  reference: string | null;
  status: PaytotaPayoutStatus;
  message: string | null;
} {
  const obj = asRecord(body) || {};
  const event = typeof obj.event_type === 'string' ? obj.event_type : '';
  const type = typeof obj.type === 'string' ? obj.type : '';
  const isPayout = type === 'payout' || event.startsWith('payout.');
  const payoutId = typeof obj.id === 'string' ? obj.id : null;
  const reference =
    (typeof obj.reference === 'string' && obj.reference) ||
    (typeof obj.reference_generated === 'string' && obj.reference_generated) ||
    null;
  const rawStatus = typeof obj.status === 'string' ? obj.status : '';
  const tx = asRecord(obj.transaction_data);
  const extra = asRecord(tx?.extra);
  const webhookPayload = asRecord(extra?.webhook_payload);
  const message = typeof webhookPayload?.message === 'string' ? webhookPayload.message : null;
  return {
    isPayout,
    payoutId,
    reference,
    status: mapPaytotaPayoutStatus(rawStatus, event),
    message,
  };
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
