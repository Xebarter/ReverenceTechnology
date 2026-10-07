'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Smartphone } from 'lucide-react';
import { authJson } from '../lib/authFetch';
import { useUser } from '../UserContext';
import { formatUgx, remainingBalance } from '../lib/projectMoney';
import {
  depositCeiling,
  depositPresets,
  isReplaceableCheckout,
  minimumDeposit,
  parseDepositAmount,
  paymentPercent,
  statusSummary,
} from '../lib/projectProgress';
import type { ClientProject, PaymentInstallment } from '../lib/types';
import { Button, Card, FieldLabel, Input } from './ui';
import { AccountPageHeader, StatusBadge } from './account';
import { PaymentMeter, StageTrack } from './project/ProjectProgress';

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function installmentLabel(item: PaymentInstallment) {
  if (item.note === 'Deposit') return 'Deposit';
  if (item.note === 'Pay remaining balance' || item.kind === 'balance') return 'Balance';
  return item.note || 'Installment';
}

export default function ClientProjectDetails() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params?.id || '');
  const { user, loading } = useUser();
  const [project, setProject] = useState<ClientProject | null>(null);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [busy, setBusy] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'mobile_money'>('mobile_money');
  const [payPhone, setPayPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [mmNotice, setMmNotice] = useState(false);
  const [waitingId, setWaitingId] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waitingIdRef = useRef<string | null>(null);
  const depositRef = useRef<HTMLDivElement>(null);
  const seededAmount = useRef(false);
  const paidNotice = searchParams?.get('payment') === '1';
  const wantsDeposit = searchParams?.get('deposit') === '1';

  const load = async (silent = false) => {
    if (!id) return;
    if (!silent) {
      setBusy(true);
      setError(null);
    }
    try {
      const data = await authJson<{
        project: ClientProject;
        installments: PaymentInstallment[];
        mobileMoney?: { failedIds?: string[] };
      }>(`/api/client-projects/${id}`);
      setProject(data.project);
      setInstallments(data.installments || []);
      setPayPhone((current) => current || data.project.customer_phone || '');
      const currentWait = waitingIdRef.current;
      const failed = data.mobileMoney?.failedIds || [];
      if (currentWait && failed.includes(currentWait)) {
        waitingIdRef.current = null;
        setWaitingId(null);
        setMmNotice(false);
        setError('The payment did not complete. Check your phone and try again.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load project.');
    } finally {
      if (!silent) setBusy(false);
    }
  };

  useEffect(() => {
    if (!user || !id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  useEffect(() => {
    if (!mmNotice) return;
    const t = window.setInterval(() => {
      load(true);
    }, 5000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mmNotice]);

  useEffect(() => {
    if (!waitingId) return;
    const inst = installments.find((i) => i.id === waitingId);
    if (inst?.status === 'paid') {
      waitingIdRef.current = null;
      setMmNotice(false);
      setWaitingId(null);
      setJustPaid(true);
      seededAmount.current = false;
      setDepositAmount('');
    }
  }, [installments, waitingId]);

  const remaining = project ? remainingBalance(project) : null;
  const ceiling = remaining != null ? depositCeiling(remaining, installments) : 0;
  const presets = useMemo(() => depositPresets(ceiling), [ceiling]);
  const minDeposit = minimumDeposit(ceiling);

  useEffect(() => {
    if (seededAmount.current || ceiling <= 0) return;
    seededAmount.current = true;
    setDepositAmount(String(Math.round(ceiling)));
  }, [ceiling]);

  useEffect(() => {
    if (!wantsDeposit || busy || !project) return;
    depositRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [wantsDeposit, busy, project]);

  const startPay = async (payload: { installmentId?: string; kind?: 'deposit'; amount?: number }) => {
    if (!id) return;
    setPayingId(payload.installmentId || 'deposit');
    setError(null);
    setJustPaid(false);
    setMmNotice(false);
    try {
      if (payMethod === 'mobile_money' && !payPhone.trim()) {
        throw new Error('Enter the mobile money number that will receive the payment prompt.');
      }
      const json = await authJson<{
        hostedCheckoutUrl?: string;
        installmentId?: string;
        awaitingPhonePrompt?: boolean;
      }>(`/api/client-projects/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          method: payMethod,
          ...(payMethod === 'mobile_money' ? { phone: payPhone.trim() } : {}),
        }),
      });
      if (payMethod === 'card') {
        if (json.hostedCheckoutUrl) {
          window.location.href = json.hostedCheckoutUrl;
          return;
        }
        throw new Error('Card checkout did not return a payment URL');
      }
      if (json.awaitingPhonePrompt) {
        const nextId = json.installmentId || payload.installmentId || null;
        waitingIdRef.current = nextId;
        setMmNotice(true);
        setWaitingId(nextId);
        setPayingId(null);
        return;
      }
      throw new Error('Could not send the payment prompt. Check the number and try again.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start payment.');
      setPayingId(null);
    }
  };

  const submitDeposit = () => {
    const amount = parseDepositAmount(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter the amount you want to deposit.');
      return;
    }
    if (amount < minDeposit) {
      setError(`Minimum deposit is ${formatUgx(minDeposit)}.`);
      return;
    }
    if (amount > ceiling) {
      setError(`You can deposit up to ${formatUgx(ceiling)} right now.`);
      return;
    }
    startPay({ kind: 'deposit', amount });
  };

  if (loading || busy) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-paper py-20 text-center">
        <p className="text-muted">{error || 'Project not found.'}</p>
        <Button className="mt-6" onClick={() => router.push('/dashboard/projects')}>
          Back to projects
        </Button>
      </div>
    );
  }

  const paid = Number(project.amount_paid || 0);
  const total = project.agreed_total != null ? Number(project.agreed_total) : null;
  const paidPct = paymentPercent(project) ?? 0;
  const dueNow = installments.filter((item) => item.status === 'requested' && !isReplaceableCheckout(item));
  const ledger = installments.filter((item) => item.status === 'paid' || dueNow.some((row) => row.id === item.id));
  const canDeposit = project.status !== 'cancelled' && ceiling > 0;
  const parsedDeposit = parseDepositAmount(depositAmount);
  const depositReady = Number.isFinite(parsedDeposit) && parsedDeposit >= minDeposit && parsedDeposit <= ceiling;

  return (
    <div className="space-y-6">
      <AccountPageHeader
        eyebrow="Project"
        title={project.title}
        description={statusSummary(project.status)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/projects')}>
              All projects
            </Button>
          </div>
        }
      />

      {(paidNotice || justPaid) && (
        <div className="flex items-start gap-3 rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" />
          Payment received. The balance on this page updates as soon as the payment is confirmed.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-ink-deep">Progress</h2>
              {project.status === 'paused' && <StatusBadge status="paused" />}
            </div>
            <div className="mt-5">
              <StageTrack status={project.status} />
            </div>
            {project.status === 'paused' && (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Work is paused at the in-progress stage. We’ll move it forward when it resumes.
              </p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl text-ink-deep">Latest update</h2>
              {project.progress_note && (
                <span className="text-xs text-muted">{formatWhen(project.updated_at)}</span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted">
              {project.progress_note || 'No progress note yet. Updates from the team will appear here as the work moves.'}
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-xl text-ink-deep">Brief</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted">
              {project.description || 'No additional details.'}
            </p>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-rule px-5 py-4 sm:px-6">
              <h2 className="font-serif text-xl text-ink-deep">Activity</h2>
            </div>
            <ActivityList project={project} installments={ledger} />
          </Card>
        </div>

        <div ref={depositRef} className="space-y-4 lg:sticky lg:top-8">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 gap-px bg-rule">
              <MoneyStat label="Agreed total" value={total != null ? formatUgx(total) : 'Pending quote'} />
              <div className="grid grid-cols-2 gap-px bg-rule">
                <MoneyStat label="Paid" value={formatUgx(paid)} />
                <MoneyStat
                  label="Remaining"
                  value={remaining != null ? formatUgx(remaining) : '—'}
                  emphasis={remaining != null && remaining > 0}
                />
              </div>
            </div>
            {total != null && (
              <div className="border-t border-rule bg-surface px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>Payment progress</span>
                  <span className="tabular-nums">{paidPct}%</span>
                </div>
                <PaymentMeter percent={paidPct} />
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-ink-deep">Deposit</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {project.status === 'cancelled'
                    ? 'Deposits are closed because this project was cancelled.'
                    : canDeposit
                      ? 'Pay any amount up to what is still open. It is applied to this project as soon as the payment is confirmed.'
                      : total == null
                        ? 'Deposits open once we agree a project total.'
                        : remaining != null && remaining <= 0
                          ? 'This project is paid in full.'
                          : 'Finish the open payment request before starting another deposit.'}
                </p>
              </div>
            </div>

            {(canDeposit || dueNow.length > 0) && (
              <div className="mt-5">
                <MethodToggle method={payMethod} onChange={setPayMethod} disabled={mmNotice} />
              </div>
            )}

            {mmNotice && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-rule bg-paper px-4 py-3 text-sm text-ink">
                <Smartphone size={18} className="mt-0.5 shrink-0 text-gold" />
                Approve the PIN prompt on your phone. This page updates when the payment is confirmed.
              </div>
            )}

            {payMethod === 'mobile_money' && (canDeposit || dueNow.length > 0) && (
              <div className="mt-4">
                <FieldLabel htmlFor="pay-phone">Mobile money number</FieldLabel>
                <Input
                  id="pay-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07XXXXXXXX"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  disabled={mmNotice}
                />
                <p className="mt-1 text-xs text-muted">MTN or Airtel. A PIN prompt is sent to this number.</p>
              </div>
            )}

            {dueNow.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">Due now</div>
                {dueNow.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-paper px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-ink-deep">{formatUgx(item.amount)}</div>
                      <div className="text-sm text-muted">
                        {item.trans_token ? 'Payment in progress' : installmentLabel(item)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startPay({ installmentId: item.id })}
                      disabled={Boolean(payingId) || mmNotice}
                    >
                      {payingId === item.id
                        ? payMethod === 'mobile_money'
                          ? 'Sending…'
                          : 'Redirecting…'
                        : 'Pay'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {canDeposit && (
              <div className="mt-5">
                {presets.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {presets.map((preset) => {
                      const selected = parsedDeposit === preset.amount;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          disabled={mmNotice}
                          onClick={() => setDepositAmount(String(preset.amount))}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 disabled:opacity-50 ${
                            selected ? 'border-ink bg-ink text-paper' : 'border-rule text-muted hover:border-ink hover:text-ink'
                          }`}
                        >
                          {preset.label}
                          <span className="ml-1.5 font-medium normal-case tracking-normal">
                            {formatUgx(preset.amount)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <FieldLabel htmlFor="deposit-amount">Amount (UGX)</FieldLabel>
                <Input
                  id="deposit-amount"
                  inputMode="numeric"
                  placeholder={String(Math.round(ceiling))}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d]/g, ''))}
                  disabled={mmNotice}
                />
                <p className="mt-1 text-xs text-muted">
                  {minDeposit < ceiling
                    ? `${formatUgx(minDeposit)} minimum · up to ${formatUgx(ceiling)}`
                    : `Pay ${formatUgx(ceiling)} to clear the open balance`}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={submitDeposit}
                  disabled={Boolean(payingId) || mmNotice || !depositReady}
                >
                  {payingId === 'deposit' ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {payMethod === 'mobile_money' ? 'Sending prompt…' : 'Redirecting…'}
                    </>
                  ) : depositReady ? (
                    parsedDeposit >= (remaining || 0) - 0.5 ? `Pay ${formatUgx(parsedDeposit)}` : `Deposit ${formatUgx(parsedDeposit)}`
                  ) : (
                    'Enter an amount'
                  )}
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {payMethod === 'mobile_money'
                    ? 'You stay on this page and approve the prompt on your phone.'
                    : 'Card payments continue on a secure checkout page.'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityList({
  project,
  installments,
}: {
  project: ClientProject;
  installments: PaymentInstallment[];
}) {
  const events: { id: string; at: string; title: string; detail: string }[] = [
    {
      id: 'created',
      at: project.created_at,
      title: 'Project submitted',
      detail: 'Your brief was received.',
    },
  ];

  if (project.progress_note) {
    events.push({
      id: 'progress',
      at: project.updated_at || project.created_at,
      title: 'Progress update',
      detail: project.progress_note,
    });
  }

  if (project.status === 'completed') {
    events.push({
      id: 'completed',
      at: project.updated_at || project.created_at,
      title: 'Marked complete',
      detail: 'The project reached the final stage.',
    });
  }

  for (const item of installments) {
    const paid = item.status === 'paid';
    events.push({
      id: item.id,
      at: paid ? item.paid_at || item.updated_at : item.requested_at,
      title: paid ? `${installmentLabel(item)} received` : `${installmentLabel(item)} requested`,
      detail: formatUgx(item.amount),
    });
  }

  events.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <ol className="px-5 py-2 sm:px-6">
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 py-3">
          {index < events.length - 1 && <span className="absolute bottom-0 left-[7px] top-6 w-px bg-rule" />}
          <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink bg-surface" />
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <div className="text-sm font-medium text-ink-deep">{event.title}</div>
              <div className="text-xs text-muted">{formatWhen(event.at)}</div>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{event.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function MethodToggle({
  method,
  onChange,
  disabled,
}: {
  method: 'card' | 'mobile_money';
  onChange: (method: 'card' | 'mobile_money') => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex rounded-xl border border-rule p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('mobile_money')}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 disabled:opacity-50 ${
          method === 'mobile_money' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
        }`}
      >
        <Smartphone size={14} />
        Mobile money
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('card')}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 disabled:opacity-50 ${
          method === 'card' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
        }`}
      >
        <CreditCard size={14} />
        Card
      </button>
    </div>
  );
}

function MoneyStat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className={`mt-1.5 font-serif text-2xl tabular-nums ${emphasis ? 'text-ink' : 'text-ink-deep'}`}>{value}</div>
    </div>
  );
}
