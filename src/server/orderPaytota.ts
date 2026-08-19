import { eq, pgPatch, pgSelect } from './supabasePostgrest';
import { getPublicAppBaseUrl } from './appBaseUrl';
import {
  createPaytotaPurchase,
  executePaytotaStk,
  getPaytotaPurchase,
  mapPaytotaStatus,
  paytotaConfigured,
  paytotaToken,
  purchaseIdFromToken,
  type PaytotaPaymentStatus,
} from './paytotaGateway';

export type PaytotaCheckoutResult = {
  purchaseId: string;
  checkoutUrl: string | null;
  stkSent: boolean;
};

function returnUrl(base: string, ref: string, failed = false): string {
  const u = new URL(`${base}/api/payments/paytota/return`);
  u.searchParams.set('ref', ref);
  if (failed) u.searchParams.set('failed', '1');
  return u.toString();
}

async function creditProjectForPaidInstallment(
  supabaseUrl: string,
  serviceKey: string,
  projectId: string,
  amount: number,
): Promise<void> {
  const now = new Date().toISOString();
  const { rows: projects } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'client_projects',
    eq('id', projectId),
    'id,amount_paid,agreed_total,status',
  );
  const project = projects[0];
  if (!project) return;
  const paid = Number(project.amount_paid || 0) + Number(amount || 0);
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

export async function attachPaytotaToOrder(input: {
  supabaseUrl: string;
  serviceKey: string;
  order: Record<string, unknown>;
  productName: string;
}): Promise<PaytotaCheckoutResult> {
  if (!paytotaConfigured()) throw new Error('Mobile money checkout is not configured');

  const orderId = String(input.order.id);
  const orderNumber = String(input.order.order_number);
  const amount = Number(input.order.total_amount);
  const email = String(input.order.customer_email ?? '');
  const name = String(input.order.customer_name ?? '');
  const phone = input.order.customer_phone != null ? String(input.order.customer_phone) : '';
  const base = getPublicAppBaseUrl();
  const ref = orderNumber;

  const purchase = await createPaytotaPurchase({
    amount,
    email,
    phone,
    name,
    productName: input.productName,
    reference: ref,
    successRedirect: returnUrl(base, ref),
    failureRedirect: returnUrl(base, ref, true),
    cancelRedirect: returnUrl(base, ref, true),
  });

  const { error } = await pgPatch(input.supabaseUrl, input.serviceKey, 'orders', eq('id', orderId), {
    trans_token: paytotaToken(purchase.id),
    payment_method: 'mobile_money',
    payment_reference: purchase.reference_generated || purchase.reference || purchase.id,
  });
  if (error) throw new Error(error);

  let stkSent = false;
  if (phone.trim()) {
    try {
      await executePaytotaStk(purchase.id);
      stkSent = true;
    } catch (e) {
      console.error('[paytota] STK execute failed, falling back to checkout URL', e);
    }
  }

  return {
    purchaseId: purchase.id,
    checkoutUrl: purchase.checkout_url || null,
    stkSent,
  };
}

export async function attachPaytotaToInstallment(input: {
  supabaseUrl: string;
  serviceKey: string;
  installmentId: string;
  amount: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  productName: string;
}): Promise<PaytotaCheckoutResult> {
  if (!paytotaConfigured()) throw new Error('Mobile money checkout is not configured');

  const base = getPublicAppBaseUrl();
  const ref = input.reference;
  const purchase = await createPaytotaPurchase({
    amount: input.amount,
    email: input.customerEmail,
    phone: input.customerPhone,
    name: input.customerName,
    productName: input.productName,
    reference: ref,
    successRedirect: returnUrl(base, ref),
    failureRedirect: returnUrl(base, ref, true),
    cancelRedirect: returnUrl(base, ref, true),
  });

  const { error } = await pgPatch(
    input.supabaseUrl,
    input.serviceKey,
    'payment_installments',
    eq('id', input.installmentId),
    {
      trans_token: paytotaToken(purchase.id),
      payment_reference: purchase.reference_generated || purchase.reference || purchase.id,
      updated_at: new Date().toISOString(),
    },
  );
  if (error) throw new Error(error);

  let stkSent = false;
  if (input.customerPhone?.trim()) {
    try {
      await executePaytotaStk(purchase.id);
      stkSent = true;
    } catch (e) {
      console.error('[paytota] STK execute failed, falling back to checkout URL', e);
    }
  }

  return {
    purchaseId: purchase.id,
    checkoutUrl: purchase.checkout_url || null,
    stkSent,
  };
}

async function applyStatusToOrder(
  supabaseUrl: string,
  serviceKey: string,
  row: Record<string, unknown>,
  status: PaytotaPaymentStatus,
  reference: string | null,
): Promise<{ orderNumber: string; statusToken: string }> {
  const orderNumber = String(row.order_number);
  const statusToken = String(row.status_token);
  if (String(row.payment_status) === 'paid') {
    return { orderNumber, statusToken };
  }
  const patch: Record<string, unknown> = {
    payment_status: status,
    payment_reference: reference || row.payment_reference || null,
  };
  if (status === 'paid') patch.order_status = 'processing';
  await pgPatch(supabaseUrl, serviceKey, 'orders', eq('id', String(row.id)), patch);
  return { orderNumber, statusToken };
}

async function applyStatusToInstallment(
  supabaseUrl: string,
  serviceKey: string,
  row: Record<string, unknown>,
  status: PaytotaPaymentStatus,
  reference: string | null,
): Promise<{ projectId: string; statusToken: string }> {
  const projectId = String(row.client_project_id);
  const statusToken = String(row.status_token);
  if (String(row.status) === 'paid') {
    return { projectId, statusToken };
  }
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    updated_at: now,
    payment_reference: reference || row.payment_reference || null,
  };
  if (status === 'paid') {
    patch.status = 'paid';
    patch.paid_at = now;
  }
  await pgPatch(supabaseUrl, serviceKey, 'payment_installments', eq('id', String(row.id)), patch);
  if (status === 'paid') {
    await creditProjectForPaidInstallment(supabaseUrl, serviceKey, projectId, Number(row.amount || 0));
  }
  return { projectId, statusToken };
}

export async function finalizePaytotaByPurchaseId(
  supabaseUrl: string,
  serviceKey: string,
  purchaseId: string,
  hintedStatus?: PaytotaPaymentStatus,
  hintedReference?: string | null,
): Promise<
  | { kind: 'installment'; projectId: string; statusToken: string }
  | { kind: 'order'; orderNumber: string; statusToken: string }
  | null
> {
  const token = paytotaToken(purchaseId);
  let status = hintedStatus || 'pending';
  let reference = hintedReference || purchaseId;

  try {
    const live = await getPaytotaPurchase(purchaseId);
    status = mapPaytotaStatus(live.status);
    reference = live.reference_generated || live.reference || purchaseId;
  } catch (e) {
    console.error('[paytota] purchase lookup failed', e);
    if (!hintedStatus) return null;
  }

  const { rows: instRows } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'payment_installments',
    eq('trans_token', token),
    'id,client_project_id,status,amount,status_token,payment_reference',
  );
  if (instRows[0]) {
    const applied = await applyStatusToInstallment(supabaseUrl, serviceKey, instRows[0], status, reference);
    return { kind: 'installment', ...applied };
  }

  const { rows: orderRows } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'orders',
    eq('trans_token', token),
    'id,order_number,status_token,payment_status,payment_reference',
  );
  if (orderRows[0]) {
    const applied = await applyStatusToOrder(supabaseUrl, serviceKey, orderRows[0], status, reference);
    return { kind: 'order', ...applied };
  }

  return null;
}

export async function finalizePaytotaByOurReference(
  supabaseUrl: string,
  serviceKey: string,
  ref: string,
): Promise<
  | { kind: 'installment'; projectId: string; statusToken: string }
  | { kind: 'order'; orderNumber: string; statusToken: string }
  | null
> {
  if (ref.startsWith('inst:')) {
    const installmentId = ref.slice(5);
    const { rows } = await pgSelect(
      supabaseUrl,
      serviceKey,
      'payment_installments',
      eq('id', installmentId),
      'id,client_project_id,status,amount,status_token,trans_token,payment_reference',
    );
    const row = rows[0];
    if (!row) return null;
    const purchaseId = purchaseIdFromToken(row.trans_token != null ? String(row.trans_token) : null);
    if (!purchaseId) {
      return { kind: 'installment', projectId: String(row.client_project_id), statusToken: String(row.status_token) };
    }
    return finalizePaytotaByPurchaseId(supabaseUrl, serviceKey, purchaseId);
  }

  const { rows } = await pgSelect(
    supabaseUrl,
    serviceKey,
    'orders',
    eq('order_number', ref),
    'id,order_number,status_token,payment_status,payment_reference,trans_token',
  );
  const row = rows[0];
  if (!row) return null;
  const purchaseId = purchaseIdFromToken(row.trans_token != null ? String(row.trans_token) : null);
  if (!purchaseId) {
    return { kind: 'order', orderNumber: String(row.order_number), statusToken: String(row.status_token) };
  }
  return finalizePaytotaByPurchaseId(supabaseUrl, serviceKey, purchaseId);
}
