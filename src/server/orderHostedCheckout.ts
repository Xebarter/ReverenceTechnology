import { eq, pgPatch, pgSelect } from './supabasePostgrest';
import { getPublicAppBaseUrl } from './appBaseUrl';
import {
  createHostedPaymentSession,
  hostedPaymentPageUrl,
  verifyHostedTransaction,
} from './hostedCheckoutGateway';

export function orderDescriptionFromRow(row: Record<string, unknown>): string {
  const items = row.items;
  if (Array.isArray(items) && items[0] && typeof items[0] === 'object' && items[0] !== null) {
    const pn = (items[0] as { product_name?: string }).product_name;
    if (typeof pn === 'string' && pn.trim()) return pn.trim().slice(0, 120);
  }
  const num = row.order_number != null ? String(row.order_number) : '';
  return num ? `Order ${num}` : 'Order';
}

export async function attachHostedCheckoutToOrder(
  supabaseUrl: string,
  serviceKey: string,
  row: Record<string, unknown>,
  serviceDescription: string,
): Promise<string> {
  const orderNumber = String(row.order_number);
  const orderId = String(row.id);
  const amount = Number(row.total_amount);
  const email = String(row.customer_email ?? '');
  const name = String(row.customer_name ?? '');

  const base = getPublicAppBaseUrl();
  const returnUrl = `${base}/api/payments/hosted/return`;
  const notifyUrl = `${base}/api/payments/hosted/notify`;

  const currency = process.env.HOSTED_CHECKOUT_CURRENCY?.trim() || 'UGX';

  const { transToken } = await createHostedPaymentSession({
    companyRef: orderNumber,
    paymentAmount: amount,
    paymentCurrency: currency,
    redirectUrl: returnUrl,
    backUrl: notifyUrl,
    customerName: name,
    customerEmail: email,
    serviceDescription,
  });

  const { error } = await pgPatch(supabaseUrl, serviceKey, 'orders', eq('id', orderId), {
    trans_token: transToken,
    payment_method: 'dpo',
  });
  if (error) throw new Error(error);

  return hostedPaymentPageUrl(transToken);
}

export async function finalizeHostedOrderByTransactionToken(
  supabaseUrl: string,
  serviceKey: string,
  transactionToken: string,
): Promise<{ orderNumber: string; statusToken: string } | null> {
  const { rows, error } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'orders',
    eq('trans_token', transactionToken),
    'id,order_number,status_token,payment_status',
  );
  if (error || !rows[0]) return null;
  const row = rows[0];

  if (String(row.payment_status) === 'paid') {
    return { orderNumber: String(row.order_number), statusToken: String(row.status_token) };
  }

  const v = await verifyHostedTransaction(transactionToken);
  const patch: Record<string, unknown> = {
    payment_status: v.payment_status,
    payment_reference: v.reference,
  };
  if (v.payment_status === 'paid') patch.order_status = 'processing';

  await pgPatch(supabaseUrl, serviceKey, 'orders', eq('id', String(row.id)), patch);

  return { orderNumber: String(row.order_number), statusToken: String(row.status_token) };
}

export async function tryFinalizeHostedOrderByTransactionToken(
  supabaseUrl: string,
  serviceKey: string,
  transactionToken: string,
): Promise<{ orderNumber: string; statusToken: string } | null> {
  try {
    return await finalizeHostedOrderByTransactionToken(supabaseUrl, serviceKey, transactionToken);
  } catch (e) {
    console.error('[hosted-checkout] verify/finalize failed', e);
    const { rows } = await pgSelect(
      supabaseUrl,
      serviceKey,
      'orders',
      eq('trans_token', transactionToken),
      'order_number,status_token',
    );
    const r = rows[0];
    if (!r) return null;
    return { orderNumber: String(r.order_number), statusToken: String(r.status_token) };
  }
}

export async function attachHostedCheckoutToInstallment(input: {
  supabaseUrl: string;
  serviceKey: string;
  installmentId: string;
  amount: number;
  companyRef: string;
  customerName: string;
  customerEmail: string;
  serviceDescription: string;
}): Promise<string> {
  const base = getPublicAppBaseUrl();
  const returnUrl = `${base}/api/payments/hosted/return`;
  const notifyUrl = `${base}/api/payments/hosted/notify`;
  const currency = process.env.HOSTED_CHECKOUT_CURRENCY?.trim() || 'UGX';

  const { transToken } = await createHostedPaymentSession({
    companyRef: input.companyRef,
    paymentAmount: input.amount,
    paymentCurrency: currency,
    redirectUrl: returnUrl,
    backUrl: notifyUrl,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    serviceDescription: input.serviceDescription,
  });

  const { error } = await pgPatch(
    input.supabaseUrl,
    input.serviceKey,
    'payment_installments',
    eq('id', input.installmentId),
    { trans_token: transToken, updated_at: new Date().toISOString() },
  );
  if (error) throw new Error(error);

  return hostedPaymentPageUrl(transToken);
}

export async function finalizeHostedInstallmentByTransactionToken(
  supabaseUrl: string,
  serviceKey: string,
  transactionToken: string,
): Promise<{ projectId: string; statusToken: string } | null> {
  const { rows, error } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'payment_installments',
    eq('trans_token', transactionToken),
    'id,client_project_id,status,amount,status_token',
  );
  if (error || !rows[0]) return null;
  const row = rows[0];
  const projectId = String(row.client_project_id);
  const statusToken = String(row.status_token);

  if (String(row.status) === 'paid') {
    return { projectId, statusToken };
  }

  const v = await verifyHostedTransaction(transactionToken);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    updated_at: now,
    payment_reference: v.reference,
  };
  if (v.payment_status === 'paid') {
    patch.status = 'paid';
    patch.paid_at = now;
  }
  await pgPatch(supabaseUrl, serviceKey, 'payment_installments', eq('id', String(row.id)), patch);

  if (v.payment_status === 'paid') {
    const { rows: projects } = await pgSelect(
      supabaseUrl,
      serviceKey,
      'client_projects',
      eq('id', projectId),
      'id,amount_paid,agreed_total,status',
    );
    const project = projects[0];
    if (project) {
      const paid = Number(project.amount_paid || 0) + Number(row.amount || 0);
      const agreed = project.agreed_total != null ? Number(project.agreed_total) : null;
      const next: Record<string, unknown> = {
        amount_paid: paid,
        updated_at: now,
      };
      if (agreed != null && paid >= agreed && String(project.status) !== 'cancelled') {
        next.status = 'completed';
      } else if (String(project.status) === 'submitted' || String(project.status) === 'in_review') {
        next.status = 'active';
      }
      await pgPatch(supabaseUrl, serviceKey, 'client_projects', eq('id', projectId), next);
    }
  }

  return { projectId, statusToken };
}

export async function tryFinalizeHostedPaymentByTransactionToken(
  supabaseUrl: string,
  serviceKey: string,
  transactionToken: string,
): Promise<
  | { kind: 'installment'; projectId: string; statusToken: string }
  | { kind: 'order'; orderNumber: string; statusToken: string }
  | null
> {
  try {
    const inst = await finalizeHostedInstallmentByTransactionToken(supabaseUrl, serviceKey, transactionToken);
    if (inst) return { kind: 'installment', ...inst };
  } catch (e) {
    console.error('[hosted-checkout] installment finalize failed', e);
    const { rows } = await pgSelect(
      supabaseUrl,
      serviceKey,
      'payment_installments',
      eq('trans_token', transactionToken),
      'client_project_id,status_token',
    );
    if (rows[0]) {
      return {
        kind: 'installment',
        projectId: String(rows[0].client_project_id),
        statusToken: String(rows[0].status_token),
      };
    }
  }

  const order = await tryFinalizeHostedOrderByTransactionToken(supabaseUrl, serviceKey, transactionToken);
  if (!order) return null;
  return { kind: 'order', ...order };
}

