/**
 * XML client for the hosted payment gateway (Network International / 3G DirectPay API v6).
 */

const DEFAULT_API = 'https://secure.3gdirectpay.com/API/v6/';
const DEFAULT_PAY_PAGE = 'https://secure.3gdirectpay.com/payv2.php';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  const m = xml.match(re);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

export function parseHostedApiResponse(xml: string): {
  result: string | null;
  resultExplanation: string | null;
  transToken: string | null;
  transRef: string | null;
} {
  return {
    result: parseTag(xml, 'Result'),
    resultExplanation: parseTag(xml, 'ResultExplanation'),
    transToken: parseTag(xml, 'TransToken'),
    transRef: parseTag(xml, 'TransRef'),
  };
}

function interpretVerify(
  xml: string,
): { payment_status: 'paid' | 'failed' | 'pending'; reference: string | null } {
  const result = parseTag(xml, 'Result') ?? '';
  const expl = (parseTag(xml, 'ResultExplanation') ?? '').toLowerCase();
  const transRef = parseTag(xml, 'TransRef') ?? parseTag(xml, 'TransactionRef');
  const approval = parseTag(xml, 'TransactionApproval');

  if (result === '000' && (expl.includes('paid') || Boolean(approval))) {
    return { payment_status: 'paid', reference: transRef };
  }
  if (result === '000') {
    return { payment_status: 'pending', reference: transRef };
  }
  if (/fail|declin|cancel|invalid|expired|error|not paid|rejected/.test(expl) || /^9/.test(result)) {
    return { payment_status: 'failed', reference: transRef };
  }
  return { payment_status: 'pending', reference: transRef };
}

function splitName(full: string): { first: string; last: string } {
  const t = full.trim();
  if (!t) return { first: 'Customer', last: '-' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '-' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() || '-' };
}

function serviceDateNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

async function postXml(endpoint: string, xml: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Accept: 'application/xml',
    },
    body: xml,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gateway HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return text;
}

export function hostedCheckoutConfigured(): boolean {
  return Boolean(process.env.HOSTED_CHECKOUT_COMPANY_TOKEN?.trim() && process.env.HOSTED_CHECKOUT_SERVICE_TYPE?.trim());
}

export type CreateHostedSessionInput = {
  companyRef: string;
  paymentAmount: number;
  paymentCurrency: string;
  redirectUrl: string;
  backUrl: string;
  customerName: string;
  customerEmail: string;
  serviceDescription: string;
  ptlHours?: number;
};

export async function createHostedPaymentSession(
  input: CreateHostedSessionInput,
): Promise<{ transToken: string; transRef: string | null }> {
  const companyToken = process.env.HOSTED_CHECKOUT_COMPANY_TOKEN?.trim();
  const serviceType = process.env.HOSTED_CHECKOUT_SERVICE_TYPE?.trim();
  const endpoint = process.env.HOSTED_CHECKOUT_API_URL?.trim() || DEFAULT_API;
  if (!companyToken || !serviceType) {
    throw new Error('Hosted checkout is not configured');
  }

  const ptl = input.ptlHours ?? (Number(process.env.HOSTED_CHECKOUT_PTL_HOURS || '24') || 24);
  const { first, last } = splitName(input.customerName);

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${escapeXml(formatAmount(input.paymentAmount))}</PaymentAmount>
    <PaymentCurrency>${escapeXml(input.paymentCurrency)}</PaymentCurrency>
    <CompanyRef>${escapeXml(input.companyRef)}</CompanyRef>
    <RedirectURL>${escapeXml(input.redirectUrl)}</RedirectURL>
    <BackURL>${escapeXml(input.backUrl)}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>${escapeXml(String(ptl))}</PTL>
    <customerFirstName>${escapeXml(first)}</customerFirstName>
    <customerLastName>${escapeXml(last)}</customerLastName>
    <customerEmail>${escapeXml(input.customerEmail)}</customerEmail>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${escapeXml(serviceType)}</ServiceType>
      <ServiceDescription>${escapeXml(input.serviceDescription)}</ServiceDescription>
      <ServiceDate>${escapeXml(serviceDateNow())}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

  const responseXml = await postXml(endpoint, xml);
  const parsed = parseHostedApiResponse(responseXml);
  if (parsed.result !== '000' || !parsed.transToken) {
    const msg = parsed.resultExplanation || 'Could not start payment session';
    throw new Error(`${msg}${parsed.result ? ` (code ${parsed.result})` : ''}`);
  }

  return { transToken: parsed.transToken, transRef: parsed.transRef };
}

export async function verifyHostedTransaction(transactionToken: string): Promise<{
  rawXml: string;
  payment_status: 'paid' | 'failed' | 'pending';
  reference: string | null;
}> {
  const companyToken = process.env.HOSTED_CHECKOUT_COMPANY_TOKEN?.trim();
  const endpoint = process.env.HOSTED_CHECKOUT_API_URL?.trim() || DEFAULT_API;
  if (!companyToken) {
    throw new Error('Hosted checkout is not configured');
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(companyToken)}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${escapeXml(transactionToken)}</TransactionToken>
  <VerifyTransaction>1</VerifyTransaction>
</API3G>`;

  const responseXml = await postXml(endpoint, xml);
  const { payment_status, reference } = interpretVerify(responseXml);
  return { rawXml: responseXml, payment_status, reference };
}

export function hostedPaymentPageUrl(transToken: string): string {
  const base = process.env.HOSTED_CHECKOUT_PAY_URL?.trim() || DEFAULT_PAY_PAGE;
  const u = new URL(base);
  u.searchParams.set('ID', transToken);
  return u.toString();
}

/** Extract transaction token from gateway callback payloads (query, form, or loose XML). */
export function extractTransactionTokenFromPayload(
  query: URLSearchParams,
  rawBody: string,
): string | null {
  const keys = ['TransactionToken', 'transactionToken', 'TransToken', 'ID', 'id'];
  for (const k of keys) {
    const q = query.get(k)?.trim();
    if (q) return q;
  }
  const body = rawBody?.trim() || '';
  if (body) {
    for (const tag of ['TransactionToken', 'TransToken', 'ID']) {
      const fromXml = parseTag(body, tag);
      if (fromXml) return fromXml;
    }
    try {
      const j = JSON.parse(body) as Record<string, unknown>;
      for (const k of ['transactionToken', 'TransactionToken', 'transToken', 'transactionId']) {
        const v = j[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    } catch {
      /* not JSON */
    }
  }
  return null;
}
