'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { authJson } from '../../lib/authFetch';
import { formatUgx, remainingBalance } from '../../lib/projectMoney';
import type { ClientProject, ClientProjectStatus, PaymentInstallment } from '../../lib/types';
import { Badge, Button, FieldLabel, Input, Textarea } from '../ui';

const STATUSES: ClientProjectStatus[] = [
  'submitted',
  'in_review',
  'active',
  'paused',
  'completed',
  'cancelled',
];

export default function AdminClientProjects() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClientProject | null>(null);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: 'submitted' as ClientProjectStatus,
    agreed_total: '',
    progress_note: '',
    admin_notes: '',
    request_amount: '',
    request_note: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await authJson<{ projects: ClientProject[] }>('/api/admin/client-projects');
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openProject = async (project: ClientProject) => {
    setSelected(project);
    setError(null);
    setForm({
      status: project.status,
      agreed_total: project.agreed_total != null ? String(project.agreed_total) : '',
      progress_note: project.progress_note || '',
      admin_notes: project.admin_notes || '',
      request_amount: '',
      request_note: '',
    });
    try {
      const data = await authJson<{ project: ClientProject; installments: PaymentInstallment[] }>(
        `/api/admin/client-projects/${project.id}`,
      );
      setSelected(data.project);
      setInstallments(data.installments || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const data = await authJson<{ project: ClientProject }>(`/api/admin/client-projects/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: form.status,
          agreed_total: form.agreed_total === '' ? null : Number(form.agreed_total),
          progress_note: form.progress_note || null,
          admin_notes: form.admin_notes || null,
        }),
      });
      setSelected(data.project);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const requestPayment = async () => {
    if (!selected) return;
    const amount = Number(form.request_amount);
    if (!amount || amount <= 0) {
      setError('Enter a payment amount');
      return;
    }
    setRequesting(true);
    setError(null);
    try {
      await authJson(`/api/admin/client-projects/${selected.id}/request-payment`, {
        method: 'POST',
        body: JSON.stringify({ amount, note: form.request_note || null }),
      });
      setForm((f) => ({ ...f, request_amount: '', request_note: '' }));
      await openProject(selected);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not request payment');
    } finally {
      setRequesting(false);
    }
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.customer_email || '').toLowerCase().includes(q) ||
      (p.customer_name || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-ink" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-admin text-2xl text-ink-deep sm:text-3xl">Client projects</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or customer"
          className="w-full border border-rule bg-surface py-2.5 pl-10 pr-3 text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-sm text-muted">No client projects yet.</p>}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => openProject(p)}
              className={`w-full rounded-md border p-4 text-left ${
                selected?.id === p.id ? 'border-ink bg-paper' : 'border-rule bg-surface hover:border-ink'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink-deep">{p.title}</div>
                  <div className="mt-1 text-sm text-muted">
                    {p.customer_name || p.customer_email || '—'} · {formatUgx(p.amount_paid)} paid
                  </div>
                </div>
                <Badge>{p.status.replace('_', ' ')}</Badge>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-ink-deep/40 lg:hidden"
            aria-label="Close project"
            onClick={() => setSelected(null)}
          />
        )}
        <div
          className={
            selected
              ? 'fixed inset-x-0 bottom-0 z-30 max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-rule bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_50px_-30px_rgb(14_36_54/0.6)] lg:static lg:z-auto lg:max-h-none lg:rounded-none lg:p-6 lg:shadow-none'
              : 'hidden border border-rule bg-surface p-6 lg:block'
          }
        >
          {selected && (
            <div className="mb-4 flex justify-end lg:hidden">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-rule px-3 py-1.5 text-sm text-ink"
              >
                Close
              </button>
            </div>
          )}
          {!selected ? (
            <p className="text-sm text-muted">Select a project to update status, quote a total, and request installments.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-admin text-xl text-ink-deep">{selected.title}</h2>
                <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{selected.description}</p>
                <p className="mt-2 text-sm text-muted">
                  {selected.customer_name} · {selected.customer_email} · {selected.customer_phone || 'no phone'}
                </p>
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientProjectStatus }))}
                  className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Agreed total (UGX)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.agreed_total}
                  onChange={(e) => setForm((f) => ({ ...f, agreed_total: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Progress note (visible to client)</FieldLabel>
                <Textarea
                  rows={3}
                  value={form.progress_note}
                  onChange={(e) => setForm((f) => ({ ...f, progress_note: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Admin notes (internal)</FieldLabel>
                <Textarea
                  rows={3}
                  value={form.admin_notes}
                  onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))}
                />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save updates'}
              </Button>

              <div className="border-t border-rule pt-4">
                <h3 className="mb-3 text-sm font-medium text-ink-deep">Request an installment</h3>
                <p className="mb-3 text-xs text-muted">
                  Remaining:{' '}
                  {remainingBalance(selected) != null ? formatUgx(remainingBalance(selected) || 0) : 'set a total first'}
                </p>
                <FieldLabel>Amount</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.request_amount}
                  onChange={(e) => setForm((f) => ({ ...f, request_amount: e.target.value }))}
                />
                <div className="mt-3">
                  <FieldLabel>Note to client (optional)</FieldLabel>
                  <Input
                    value={form.request_note}
                    onChange={(e) => setForm((f) => ({ ...f, request_note: e.target.value }))}
                    placeholder="Milestone 1 — design"
                  />
                </div>
                <Button className="mt-3 w-full" variant="secondary" onClick={requestPayment} disabled={requesting}>
                  {requesting ? 'Requesting…' : 'Request payment'}
                </Button>
              </div>

              <div className="border-t border-rule pt-4">
                <h3 className="mb-3 text-sm font-medium text-ink-deep">Payment history</h3>
                {installments.length === 0 ? (
                  <p className="text-sm text-muted">No installments yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {installments.map((i) => (
                      <li key={i.id} className="flex justify-between gap-2">
                        <span>
                          {formatUgx(i.amount)} {i.note ? `· ${i.note}` : ''}
                        </span>
                        <span className="text-muted">{i.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
