'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Landmark, RefreshCw, Search, Smartphone } from 'lucide-react';
import { authFetch, authJson } from '../../lib/authFetch';
import { formatUgx } from '../../lib/projectMoney';
import type { AccountBalance, Disbursement, DisbursementStatus, DisbursementType } from '../../lib/disbursements';
import { Button, FieldLabel, Input, Textarea } from '../ui';

type FormState = {
  payout_type: DisbursementType;
  amount: string;
  description: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  bank_name: string;
  bank_code: string;
  bank_account_name: string;
  bank_account_number: string;
};

type StatusFilter = 'all' | 'open' | 'success' | 'error';

const emptyForm: FormState = {
  payout_type: 'mobile',
  amount: '',
  description: '',
  recipient_name: '',
  recipient_email: '',
  recipient_phone: '',
  bank_name: '',
  bank_code: '',
  bank_account_name: '',
  bank_account_number: '',
};

function money(amount: number, currency: string) {
  if (currency.toUpperCase() === 'UGX') return formatUgx(amount);
  return `${currency} ${amount.toLocaleString('en-UG')}`;
}

function when(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-UG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function digits(value: string) {
  return value.replace(/[^\d]/g, '');
}

function statusLabel(status: DisbursementStatus) {
  if (status === 'success') return 'Sent';
  if (status === 'error') return 'Failed';
  if (status === 'pending') return 'Processing';
  if (status === 'initialized') return 'Started';
  return 'Preparing';
}

function statusClass(status: DisbursementStatus) {
  if (status === 'success') return 'bg-emerald-50 text-emerald-800';
  if (status === 'error') return 'bg-red-50 text-red-800';
  if (status === 'pending' || status === 'initialized') return 'bg-gold/15 text-ink-deep';
  return 'bg-paper-2 text-muted';
}

export default function AdminDisbursements() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [rows, setRows] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [form, setForm] = useState<FormState>(emptyForm);

  const payoutBalance = useMemo(() => {
    return balances.find((row) => row.currency.toUpperCase() === 'UGX') || balances[0] || null;
  }, [balances]);

  const amount = Number(digits(form.amount));
  const amountReady = Number.isFinite(amount) && amount >= 1;
  const sendable = payoutBalance?.balance ?? null;
  const overLimit = Boolean(sendable != null && amountReady && amount > sendable);
  const remaining = sendable != null && amountReady ? sendable - amount : sendable;
  const currency = payoutBalance?.currency || 'UGX';
  const amountHint =
    remaining == null
      ? 'Balance still loading.'
      : overLimit
        ? `That is more than the account balance of ${money(payoutBalance?.balance || 0, currency)}.`
        : amountReady
          ? `${money(Math.max(0, remaining), currency)} of the account balance would remain.`
          : payoutBalance
            ? `${money(payoutBalance.balance, payoutBalance.currency)} available to send.`
            : 'Enter a whole amount in shillings.';

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === 'open' && (row.status === 'success' || row.status === 'error')) return false;
      if (filter === 'success' && row.status !== 'success') return false;
      if (filter === 'error' && row.status !== 'error') return false;
      if (!needle) return true;
      return [row.recipient_name, row.recipient_phone, row.recipient_email, row.reference, row.description, row.bank_account_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, filter]);

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setBalanceError(null);
    setListError(null);
    try {
      const [balanceResult, listResult] = await Promise.allSettled([
        authJson<{ balances: AccountBalance[] }>('/api/admin/disbursements/balance'),
        authJson<{ disbursements: Disbursement[] }>('/api/admin/disbursements'),
      ]);
      if (balanceResult.status === 'fulfilled') setBalances(balanceResult.value.balances || []);
      else setBalanceError(balanceResult.reason instanceof Error ? balanceResult.reason.message : 'Could not load the Paytota balance.');
      if (listResult.status === 'fulfilled') setRows(listResult.value.disbursements || []);
      else setListError(listResult.reason instanceof Error ? listResult.reason.message : 'Could not load disbursements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchForm = (patch: Partial<FormState>) => {
    setReviewing(false);
    setConfirmed(false);
    setFormError(null);
    setForm((current) => ({ ...current, ...patch }));
  };

  const review = () => {
    setFormError(null);
    setNotice(null);
    if (!amountReady) {
      setFormError('Enter an amount in Uganda shillings.');
      return;
    }
    if (overLimit && payoutBalance) {
      setFormError(`That is more than the account balance of ${money(payoutBalance.balance, payoutBalance.currency)}.`);
      return;
    }
    if (!form.recipient_name.trim() || !form.recipient_phone.trim() || !form.recipient_email.trim() || !form.description.trim()) {
      setFormError('Fill in the recipient and a short description.');
      return;
    }
    if (form.payout_type === 'bank' && (!form.bank_name.trim() || !form.bank_code.trim() || !form.bank_account_name.trim() || !form.bank_account_number.trim())) {
      setFormError('Enter the bank name, code, account name, and account number.');
      return;
    }
    setReviewing(true);
  };

  const send = async () => {
    setSending(true);
    setFormError(null);
    setNotice(null);
    try {
      const resp = await authFetch('/api/admin/disbursements', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount,
        }),
      });
      const json = (await resp.json().catch(() => null)) as { error?: string; disbursement?: Disbursement } | null;
      if (!resp.ok) {
        setFormError(json?.error || 'Could not send the disbursement.');
        setReviewing(false);
        setConfirmed(false);
        await load(true);
        return;
      }
      setNotice(json?.disbursement?.status === 'success' ? 'Disbursement completed.' : 'Disbursement sent. Paytota is processing it.');
      setForm(emptyForm);
      setReviewing(false);
      setConfirmed(false);
      await load(true);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Could not send the disbursement.');
    } finally {
      setSending(false);
    }
  };

  const refreshOne = async (id: string) => {
    setRefreshingId(id);
    setListError(null);
    try {
      const data = await authJson<{ disbursement: Disbursement }>(`/api/admin/disbursements/${id}/refresh`, {
        method: 'POST',
      });
      setRows((current) => current.map((row) => (row.id === id ? data.disbursement : row)));
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Could not refresh that disbursement.');
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Paytota</p>
          <h1 className="mt-2 font-admin text-2xl tracking-tight text-ink-deep sm:text-3xl">Disbursements</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            See what can leave the account, review the recipient, then send mobile money or a bank payout.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="min-h-11 w-full sm:w-auto"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {notice && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <Check size={16} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      )}

      <section className="mb-8">
        {loading && balances.length === 0 ? (
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="h-28 animate-pulse rounded-2xl bg-paper-2 sm:h-32" />
            <div className="grid gap-3 sm:grid-cols-3 lg:contents">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-paper-2 sm:h-32" />
              ))}
            </div>
          </div>
        ) : balanceError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {balanceError}
          </div>
        ) : payoutBalance ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_1fr_1fr_1fr]">
            <div className="panel-dark relative overflow-hidden p-5 text-paper sm:p-6">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Available to send</p>
              <p className="mt-3 break-words font-admin text-[1.75rem] leading-tight tracking-tight sm:text-4xl">
                {money(payoutBalance.balance, payoutBalance.currency)}
              </p>
              <p className="mt-2 text-sm text-paper/70">Equal to the account balance</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:contents">
              <Stat label="Account balance" value={money(payoutBalance.balance, payoutBalance.currency)} hint="After fees" />
              <Stat label="Available balance" value={money(payoutBalance.available_balance, payoutBalance.currency)} hint="Can be withdrawn" />
              <Stat
                label="Pending"
                value={money(payoutBalance.pending_outgoing, payoutBalance.currency)}
                hint={`${money(payoutBalance.pending_payouts, payoutBalance.currency)} in payouts`}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Paytota balance is unavailable.</p>
        )}
      </section>

      <div className="grid min-w-0 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
        <form
          className="min-w-0 rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (reviewing) void send();
            else review();
          }}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 className="font-admin text-lg text-ink-deep sm:text-xl">{reviewing ? 'Confirm send' : 'New disbursement'}</h2>
            <p className="shrink-0 pt-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted">
              {reviewing ? 'Step 2 of 2' : 'Step 1 of 2'}
            </p>
          </div>

          {formError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {formError}
            </div>
          )}

          {!reviewing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1">
              {([
                ['mobile', 'Mobile money', Smartphone],
                ['bank', 'Bank', Landmark],
              ] as const).map(([type, label, Icon]) => {
                const selected = form.payout_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => patchForm({ payout_type: type })}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm transition duration-200 ${
                      selected ? 'bg-surface text-ink-deep shadow-[0_1px_2px_rgb(14_36_54/0.08)]' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Icon size={15} className={selected ? 'text-gold' : ''} />
                    <span className="sm:hidden">{type === 'mobile' ? 'Mobile' : 'Bank'}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">UGX</span>
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={form.amount ? Number(digits(form.amount)).toLocaleString('en-UG') : ''}
                  onChange={(e) => patchForm({ amount: digits(e.target.value) })}
                  className="pl-14"
                  placeholder="0"
                  required
                />
              </div>
              <p className={`mt-2 text-xs ${overLimit ? 'text-red-700' : 'text-muted'}`}>{amountHint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="recipient_name">Recipient name</FieldLabel>
                <Input id="recipient_name" value={form.recipient_name} onChange={(e) => patchForm({ recipient_name: e.target.value })} required />
              </div>
              <div>
                <FieldLabel htmlFor="recipient_phone">Phone</FieldLabel>
                <Input
                  id="recipient_phone"
                  value={form.recipient_phone}
                  onChange={(e) => patchForm({ recipient_phone: e.target.value })}
                  placeholder="MTN or Airtel, 07…"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="recipient_email">Email</FieldLabel>
                <Input
                  id="recipient_email"
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => patchForm({ recipient_email: e.target.value })}
                  required
                />
              </div>
            </div>

            {form.payout_type === 'bank' && (
              <div className="grid gap-4 rounded-xl border border-rule bg-paper p-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="bank_name">Bank name</FieldLabel>
                  <Input id="bank_name" value={form.bank_name} onChange={(e) => patchForm({ bank_name: e.target.value })} placeholder="Stanbic Bank" required />
                </div>
                <div>
                  <FieldLabel htmlFor="bank_code">Bank code</FieldLabel>
                  <Input id="bank_code" value={form.bank_code} onChange={(e) => patchForm({ bank_code: e.target.value })} placeholder="SBICUGKX" required />
                </div>
                <div>
                  <FieldLabel htmlFor="bank_account_name">Account name</FieldLabel>
                  <Input id="bank_account_name" value={form.bank_account_name} onChange={(e) => patchForm({ bank_account_name: e.target.value })} required />
                </div>
                <div>
                  <FieldLabel htmlFor="bank_account_number">Account number</FieldLabel>
                  <Input
                    id="bank_account_number"
                    value={form.bank_account_number}
                    onChange={(e) => patchForm({ bank_account_number: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <FieldLabel htmlFor="description">What is this for?</FieldLabel>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => patchForm({ description: e.target.value })} required />
            </div>
          </div>
          ) : (
            <div className="space-y-4">
              <dl className="divide-y divide-rule rounded-xl border border-rule bg-paper">
                <SummaryRow label="Amount" value={money(amount || 0, 'UGX')} />
                <SummaryRow label="Method" value={form.payout_type === 'mobile' ? 'Mobile money' : 'Bank'} />
                <SummaryRow label="Recipient" value={form.recipient_name} />
                <SummaryRow label="Phone" value={form.recipient_phone} />
                <SummaryRow label="Email" value={form.recipient_email} />
                {form.payout_type === 'bank' && (
                  <SummaryRow label="Account" value={`${form.bank_name} · ${form.bank_account_number}`} />
                )}
                <SummaryRow label="Note" value={form.description} />
              </dl>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-rule px-4 py-3 text-sm text-ink">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
                <span>Send this from the Paytota account. This cannot be undone here.</span>
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
            {reviewing && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => {
                  setReviewing(false);
                  setConfirmed(false);
                }}
              >
                Edit
              </Button>
            )}
            <Button type="submit" disabled={sending || overLimit || (reviewing && !confirmed)} className="min-h-11 w-full flex-1">
              {sending ? 'Sending…' : reviewing ? 'Send disbursement' : 'Review'}
            </Button>
          </div>
        </form>

        <section className="min-w-0 rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-admin text-xl text-ink-deep">History</h2>
            <p className="text-sm text-muted">
              {visibleRows.length === rows.length ? `${rows.length} records` : `${visibleRows.length} of ${rows.length}`}
            </p>
          </div>

          <div className="relative mt-4">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, or reference"
              className="w-full rounded-xl border border-rule bg-paper py-3 pl-10 pr-3 text-base text-ink placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/40 sm:py-2.5 sm:text-sm"
            />
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide" role="group" aria-label="Filter disbursements">
            {(
              [
                ['all', 'All'],
                ['open', 'In progress'],
                ['success', 'Sent'],
                ['error', 'Failed'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-xs font-medium transition duration-200 ${
                  filter === value ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {listError && <p className="mt-4 text-sm text-red-800">{listError}</p>}

          <div className="mt-4 space-y-3">
            {loading && rows.length === 0 && (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-xl bg-paper-2" />
                <div className="h-24 animate-pulse rounded-xl bg-paper-2" />
              </div>
            )}
            {!loading && rows.length === 0 && (
              <div className="rounded-xl border border-dashed border-rule px-6 py-10 text-center">
                <p className="font-medium text-ink-deep">No disbursements yet</p>
                <p className="mt-1 text-sm text-muted">A payout appears here as soon as Paytota accepts it.</p>
              </div>
            )}
            {!loading && rows.length > 0 && visibleRows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">Nothing matches that search.</p>
            )}
            {visibleRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-rule bg-paper px-3.5 py-3.5 transition duration-200 hover:border-ink/30 sm:px-4 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink-deep">{money(row.amount, row.currency)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm text-ink">{row.recipient_name || 'Recipient'}</p>
                    <p className="mt-0.5 break-all text-sm text-muted">
                      {row.payout_type === 'mobile' ? 'Mobile money' : row.bank_name || 'Bank'}
                      {' · '}
                      {row.payout_type === 'mobile' ? row.recipient_phone : row.bank_account_number}
                    </p>
                    {row.description && <p className="mt-1 break-words text-sm text-muted">{row.description}</p>}
                    {row.failure_message && <p className="mt-2 break-words text-sm text-red-800">{row.failure_message}</p>}
                    <p className="mt-2 break-all text-xs text-muted">
                      {row.reference} · {when(row.created_at)}
                    </p>
                  </div>
                  {row.paytota_id && row.status !== 'success' && (
                    <button
                      type="button"
                      onClick={() => refreshOne(row.id)}
                      disabled={refreshingId === row.id}
                      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-rule bg-surface px-3 text-xs font-medium text-ink transition duration-200 hover:border-ink disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-1.5"
                    >
                      <RefreshCw size={12} className={refreshingId === row.id ? 'animate-spin' : ''} />
                      {refreshingId === row.id ? 'Checking' : 'Update'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, className = '' }: { label: string; value: string; hint: string; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:p-5 ${className}`}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 break-words font-admin text-xl leading-tight tracking-tight text-ink-deep sm:mt-3 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="break-words text-sm text-ink-deep">{value}</dd>
    </div>
  );
}
