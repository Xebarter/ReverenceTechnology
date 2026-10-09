import type { AccountBalance, Disbursement, DisbursementStatus, DisbursementType } from '../lib/disbursements';
import { AuthError, authErrorResponse } from './requireAuth';
import { eq, pgInsertRow, pgPatch, pgSelect } from './supabasePostgrest';
import {
  createPaytotaPayout,
  executePaytotaMobilePayout,
  executePaytotaPayout,
  getPaytotaAccountBalance,
  getPaytotaPayout,
  mapPaytotaPayoutStatus,
  payoutFailureMessage,
  paytotaConfigured,
  requireUgMobile,
  ugPayoutTarget,
  type PaytotaPayoutStatus,
} from './paytotaGateway';

const OPEN_STATUSES = new Set(['creating', 'initialized', 'pending']);

export function disbursementsConfigured(): boolean {
  return paytotaConfigured();
}

export function disbursementHttpError(error: unknown): { body: { error: string }; status: number } {
  if (error instanceof AuthError) return authErrorResponse(error);
  const message = error instanceof Error ? error.message : 'Could not complete the disbursement request.';
  const status = /storage is not ready|not configured/i.test(message) ? 503 : 400;
  return { body: { error: message }, status };
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function mapRow(row: Record<string, unknown>): Disbursement {
  return {
    id: String(row.id),
    paytota_id: text(row.paytota_id),
    reference: String(row.reference || ''),
    payout_type: row.payout_type === 'bank' ? 'bank' : 'mobile',
    status: (text(row.status) || 'creating') as DisbursementStatus,
    amount: Number(row.amount) || 0,
    currency: text(row.currency) || 'UGX',
    description: text(row.description),
    recipient_name: text(row.recipient_name),
    recipient_email: text(row.recipient_email),
    recipient_phone: text(row.recipient_phone),
    bank_name: text(row.bank_name),
    bank_code: text(row.bank_code),
    bank_account_name: text(row.bank_account_name),
    bank_account_number: text(row.bank_account_number),
    failure_message: text(row.failure_message),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

function newReference(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DSB-${stamp}-${suffix}`;
}

export async function readPaytotaBalances(): Promise<AccountBalance[]> {
  const balances = await getPaytotaAccountBalance();
  return Object.entries(balances).map(([currency, row]) => ({
    currency,
    balance: row.balance,
    gross_balance: row.gross_balance,
    available_balance: row.available_balance,
    available_payout_balance: row.available_payout_balance,
    payout_balance: row.payout_balance,
    pending_outgoing: row.pending_outgoing,
    pending_payouts: row.pending_payouts,
    reserved: row.reserved,
  }));
}

async function patchDisbursement(
  url: string,
  serviceKey: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<Disbursement | null> {
  const { rows, error } = await pgPatch(url, serviceKey, 'disbursements', eq('id', id), {
    ...patch,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error);
  return rows[0] ? mapRow(rows[0]) : null;
}

function needsStatusSync(row: Disbursement): boolean {
  if (!row.paytota_id) return false;
  if (OPEN_STATUSES.has(row.status)) return true;
  return row.status === 'error' && !row.failure_message;
}

async function syncFromPaytota(url: string, serviceKey: string, row: Disbursement): Promise<Disbursement> {
  if (!needsStatusSync(row) || !row.paytota_id) return row;
  try {
    const remote = await getPaytotaPayout(row.paytota_id);
    const status = mapPaytotaPayoutStatus(remote.status, remote.event_type);
  const failure =
    status === 'error' ? explainPayoutFailure(payoutFailureMessage(remote) || row.failure_message, row.recipient_phone) : null;
    if (status === row.status && failure === row.failure_message) return row;
    const saved = await patchDisbursement(url, serviceKey, row.id, {
      status,
      failure_message: failure,
    }).catch((error: unknown) => {
      console.error('[disbursements] could not save payout status', row.reference, error);
      return null;
    });
    return saved || { ...row, status, failure_message: failure };
  } catch (error) {
    console.error('[disbursements] status sync failed', row.reference, error instanceof Error ? error.message : error);
    return row;
  }
}

export async function listDisbursements(url: string, serviceKey: string): Promise<Disbursement[]> {
  const { rows, error } = await pgSelect(url, serviceKey, 'disbursements', 'order=created_at.desc', '*');
  if (error) {
    if (/disbursements/i.test(error) && /schema|relation|does not exist|not found/i.test(error)) {
      throw new Error('Disbursements storage is not ready. Apply the latest database migration.');
    }
    throw new Error(error);
  }
  const mapped = rows.map(mapRow);
  const open = mapped.filter(needsStatusSync).slice(0, 12);
  const refreshed = new Map<string, Disbursement>();
  for (const row of open) {
    refreshed.set(row.id, await syncFromPaytota(url, serviceKey, row));
  }
  return mapped.map((row) => refreshed.get(row.id) || row);
}

export async function refreshDisbursement(
  url: string,
  serviceKey: string,
  id: string,
): Promise<Disbursement> {
  const { rows, error } = await pgSelect(url, serviceKey, 'disbursements', eq('id', id), '*');
  if (error) throw new Error(error);
  if (!rows[0]) throw new Error('Disbursement not found.');
  const row = mapRow(rows[0]);
  if (!row.paytota_id) return row;
  const remote = await getPaytotaPayout(row.paytota_id);
  const status = mapPaytotaPayoutStatus(remote.status, remote.event_type);
  const failure =
    status === 'error' ? explainPayoutFailure(payoutFailureMessage(remote) || row.failure_message, row.recipient_phone) : null;
  return (
    (await patchDisbursement(url, serviceKey, row.id, {
      status,
      failure_message: failure,
    })) || { ...row, status, failure_message: failure }
  );
}

export type CreateDisbursementInput = {
  payoutType: DisbursementType;
  amount: number;
  description: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  bankName?: string;
  bankCode?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  createdBy: string;
};

function clean(value: string | undefined): string {
  return (value || '').trim();
}

function explainPayoutFailure(message: string | null, phone256?: string): string {
  const text = (message || '').replace(/\s+/g, ' ').trim();
  const generic = !text || /unrecognized transaction/i.test(text) || /^failed\.?\s*\.?$/i.test(text);
  if (!generic) return text;
  let network = 'The mobile network';
  if (phone256) {
    try {
      network = ugPayoutTarget(phone256).network === 'airtel' ? 'Airtel' : 'MTN';
    } catch {
      network = 'The mobile network';
    }
  }
  const wallet = network === 'The mobile network' ? 'mobile money' : network;
  return `${network} received the payout and returned FAILED without a reference. Paytota has to enable ${wallet} disbursements on this account before a send can complete.`;
}

export async function createDisbursement(
  url: string,
  serviceKey: string,
  input: CreateDisbursementInput,
): Promise<Disbursement> {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount < 1) throw new Error('Enter an amount in Uganda shillings.');
  const description = clean(input.description).slice(0, 180);
  const recipientName = clean(input.recipientName).slice(0, 120);
  const recipientEmail = clean(input.recipientEmail).toLowerCase();
  const recipientPhone = requireUgMobile(input.recipientPhone);
  if (input.payoutType === 'mobile') ugPayoutTarget(recipientPhone);
  if (!description) throw new Error('Add a short description for this disbursement.');
  if (!recipientName) throw new Error('Enter the recipient name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new Error('Enter a valid recipient email.');

  const bankName = clean(input.bankName);
  const bankCode = clean(input.bankCode);
  const bankAccountName = clean(input.bankAccountName);
  const bankAccountNumber = clean(input.bankAccountNumber).replace(/\s+/g, '');
  if (input.payoutType === 'bank') {
    if (!bankName || !bankCode || !bankAccountName || !/^\d{6,20}$/.test(bankAccountNumber)) {
      throw new Error('Enter the bank name, bank code, account name, and account number.');
    }
  }

  const balances = await readPaytotaBalances();
  const ugx = balances.find((row) => row.currency.toUpperCase() === 'UGX') || balances[0];
  if (ugx && amount > ugx.balance) {
    throw new Error(
      `That is more than the account balance of ${Math.floor(ugx.balance).toLocaleString('en-UG')} ${ugx.currency}.`,
    );
  }

  const reference = newReference();
  const { row, error } = await pgInsertRow(url, serviceKey, 'disbursements', {
    reference,
    payout_type: input.payoutType,
    status: 'creating',
    amount,
    currency: 'UGX',
    description,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    recipient_phone: recipientPhone,
    bank_name: input.payoutType === 'bank' ? bankName : null,
    bank_code: input.payoutType === 'bank' ? bankCode : null,
    bank_account_name: input.payoutType === 'bank' ? bankAccountName : null,
    bank_account_number: input.payoutType === 'bank' ? bankAccountNumber : null,
    created_by: input.createdBy,
  });
  if (error || !row) {
    if (error && /disbursements/i.test(error) && /schema|relation|does not exist|not found/i.test(error)) {
      throw new Error('Disbursements storage is not ready. Apply the latest database migration.');
    }
    throw new Error(error || 'Could not record this disbursement.');
  }
  const created = mapRow(row);

  try {
    const payout = await createPaytotaPayout({
      email: recipientEmail,
      phone: recipientPhone,
      fullName: input.payoutType === 'bank' ? recipientName : undefined,
      bankAccount: input.payoutType === 'bank' ? bankAccountNumber : undefined,
      amount,
      description,
      reference,
    });
    await patchDisbursement(url, serviceKey, created.id, {
      paytota_id: payout.id,
      status: 'initialized',
    });
    if (!payout.execution_url) throw new Error('Paytota did not return a payout execution URL.');

    const executed =
      input.payoutType === 'bank'
        ? await executePaytotaPayout(payout.execution_url, {
            payout_type: 'bank',
            bank_name: bankName,
            bank_code: bankCode,
            bank_account_name: bankAccountName,
            bank_account_number: bankAccountNumber,
          })
        : await executePaytotaMobilePayout(payout.execution_url, recipientPhone);
    let status = executed.status;
    let failure: string | null = null;
    if (status !== 'success') {
      try {
        const remote = await getPaytotaPayout(payout.id);
        status = mapPaytotaPayoutStatus(remote.status, remote.event_type);
        if (status === 'error') failure = payoutFailureMessage(remote);
      } catch (error) {
        console.error('[disbursements] payout status check failed', reference, error instanceof Error ? error.message : error);
      }
    }
    if (status === 'error') {
      throw new Error(explainPayoutFailure(failure, recipientPhone));
    }
    const saved = await patchDisbursement(url, serviceKey, created.id, {
      status,
      failure_message: null,
    });
    return saved || { ...created, paytota_id: payout.id, status };
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Paytota could not send this disbursement.';
    const message = input.payoutType === 'mobile' ? explainPayoutFailure(raw, recipientPhone) : raw;
    const saved = await patchDisbursement(url, serviceKey, created.id, {
      status: 'error',
      failure_message: message,
    }).catch(() => null);
    if (saved) {
      const wrapped = new Error(message) as Error & { disbursement?: Disbursement };
      wrapped.disbursement = saved;
      throw wrapped;
    }
    throw error;
  }
}

export async function applyPaytotaPayoutWebhook(
  url: string,
  serviceKey: string,
  input: { payoutId: string | null; reference: string | null; status: PaytotaPayoutStatus; message: string | null },
): Promise<void> {
  let id = '';
  if (input.payoutId) {
    const { rows } = await pgSelect(url, serviceKey, 'disbursements', eq('paytota_id', input.payoutId), 'id');
    id = rows[0]?.id ? String(rows[0].id) : '';
  }
  if (!id && input.reference) {
    const { rows } = await pgSelect(url, serviceKey, 'disbursements', eq('reference', input.reference), 'id');
    id = rows[0]?.id ? String(rows[0].id) : '';
  }
  if (!id) return;
  const status: DisbursementStatus = input.status;
  await patchDisbursement(url, serviceKey, id, {
    ...(input.payoutId ? { paytota_id: input.payoutId } : {}),
    status,
    failure_message: status === 'error' ? input.message : null,
  });
}
