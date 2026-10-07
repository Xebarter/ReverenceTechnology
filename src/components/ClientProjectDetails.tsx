'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Smartphone } from 'lucide-react';
import { authJson } from '../lib/authFetch';
import { useUser } from '../UserContext';
import { formatUgx, remainingBalance } from '../lib/projectMoney';
import type { ClientProject, PaymentInstallment } from '../lib/types';
import { Button, Card, FieldLabel, Input } from './ui';
import { AccountPageHeader, StatusBadge } from './account';

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
  const [mmNotice, setMmNotice] = useState(false);
  const [waitingId, setWaitingId] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waitingIdRef = useRef<string | null>(null);
  const paidNotice = searchParams?.get('payment') === '1';

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
    }
  }, [installments, waitingId]);

  const startPay = async (payload: { installmentId?: string; kind?: 'balance' }) => {
    if (!id) return;
    setPayingId(payload.installmentId || 'balance');
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

  const remaining = remainingBalance(project);
  const paid = Number(project.amount_paid || 0);
  const total = project.agreed_total != null ? Number(project.agreed_total) : null;
  const paidPct = total && total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const openInstallments = installments.filter((i) => i.status === 'requested');

  return (
    <div className="space-y-6">
      <AccountPageHeader
        eyebrow="Project"
        title={project.title}
        description={project.progress_note || 'We’ll post progress updates here as work moves forward.'}
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
        <div className="flex items-start gap-3 rounded-md border border-rule bg-paper px-4 py-3 text-sm text-ink">
          <CheckCircle2 size={18} className="mt-0.5 text-gold" />
          Payment received. This page will show the updated balance shortly.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-rule">
        <div className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-3">
          <MoneyStat label="Agreed total" value={total != null ? formatUgx(total) : 'Pending quote'} />
          <MoneyStat label="Paid" value={formatUgx(paid)} />
          <MoneyStat
            label="Remaining"
            value={remaining != null ? formatUgx(remaining) : '—'}
            emphasis={remaining != null && remaining > 0}
          />
        </div>
        {total != null && (
          <div className="border-t border-rule bg-surface px-5 py-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted">
              <span>Payment progress</span>
              <span className="tabular-nums">{paidPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-ink" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <Card className="p-6 sm:p-7">
        <h2 className="font-serif text-xl text-ink-deep">Brief</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted">
          {project.description || 'No additional details.'}
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4 sm:px-6">
          <h2 className="font-serif text-xl text-ink-deep">Payments</h2>
          <div className="flex rounded-md border border-rule p-0.5">
            <button
              type="button"
              onClick={() => setPayMethod('mobile_money')}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                payMethod === 'mobile_money' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              <Smartphone size={14} />
              Mobile money
            </button>
            <button
              type="button"
              onClick={() => setPayMethod('card')}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                payMethod === 'card' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              <CreditCard size={14} />
              Card
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {mmNotice && (
            <div className="mb-5 flex items-start gap-3 rounded-md border border-rule bg-paper px-4 py-3 text-sm text-ink">
              <Smartphone size={18} className="mt-0.5 text-gold" />
              Approve the PIN prompt on your phone. This page updates when the payment is confirmed.
            </div>
          )}
          {payMethod === 'mobile_money' && (openInstallments.length > 0 || (remaining != null && remaining > 0)) && (
            <div className="mb-5">
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
          {remaining != null && remaining > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {payMethod === 'mobile_money'
                  ? 'Approve the prompt on your phone to pay. You stay on this page.'
                  : 'You’ll complete card payment on a secure page.'}
              </p>
              <Button onClick={() => startPay({ kind: 'balance' })} disabled={Boolean(payingId) || mmNotice} size="sm">
                {payingId === 'balance'
                  ? payMethod === 'mobile_money'
                    ? 'Sending prompt…'
                    : 'Redirecting…'
                  : `Pay remaining ${formatUgx(remaining)}`}
              </Button>
            </div>
          )}
          {openInstallments.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                Requested by the team
              </div>
              {openInstallments.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule bg-paper px-4 py-4"
                >
                  <div>
                    <div className="font-medium text-ink-deep">{formatUgx(i.amount)}</div>
                    {i.note && <div className="text-sm text-muted">{i.note}</div>}
                  </div>
                  <Button size="sm" onClick={() => startPay({ installmentId: i.id })} disabled={Boolean(payingId) || mmNotice}>
                    {payingId === i.id
                      ? payMethod === 'mobile_money'
                        ? 'Sending prompt…'
                        : 'Redirecting…'
                      : 'Pay this installment'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {installments.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              No payment requests yet. After we agree a total, you can pay in full here, or wait for installment
              requests.
            </p>
          ) : (
            <div>
              <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-rule pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:grid">
                <span>Installment</span>
                <span>Date</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-rule">
                {installments.map((i) => (
                  <div
                    key={i.id}
                    className="grid grid-cols-1 items-center gap-2 py-3 sm:grid-cols-[1fr_auto_auto] sm:gap-4"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink-deep">
                        {formatUgx(i.amount)}
                        <span className="ml-2 font-normal text-muted">· {i.kind}</span>
                      </div>
                      {i.note && <div className="text-xs text-muted">{i.note}</div>}
                    </div>
                    <div className="text-sm tabular-nums text-muted">
                      {new Date(i.requested_at).toLocaleDateString()}
                    </div>
                    <div className="sm:text-right">
                      <StatusBadge status={i.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
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
    <div className="bg-surface px-5 py-5">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className={`mt-2 font-serif text-2xl tabular-nums ${emphasis ? 'text-ink' : 'text-ink-deep'}`}>{value}</div>
    </div>
  );
}
