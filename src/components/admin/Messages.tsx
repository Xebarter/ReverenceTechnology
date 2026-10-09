'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Mail, Phone, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui';

interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  service_interest: string;
  message: string;
  status: string;
  created_at: string;
}

type StatusFilter = 'all' | 'new' | 'contacted' | 'closed';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id),
    full_name: text(row.full_name) || 'Unknown',
    email: text(row.email),
    phone: text(row.phone) || text(row.phone_number),
    company: text(row.company) || text(row.company_name),
    service_interest: text(row.service_interest) || text(row.interested_package),
    message: text(row.message),
    status: text(row.status) || 'new',
    created_at: text(row.created_at),
  };
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

function statusLabel(status: string) {
  if (status === 'contacted') return 'Contacted';
  if (status === 'closed') return 'Closed';
  return 'New';
}

function statusClass(status: string) {
  if (status === 'contacted') return 'bg-emerald-50 text-emerald-800';
  if (status === 'closed') return 'bg-paper-2 text-muted';
  return 'bg-gold/15 text-ink-deep';
}

export default function Messages() {
  const [messages, setMessages] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const selected = messages.find((message) => message.id === selectedId) || null;

  const counts = useMemo(
    () => ({
      all: messages.length,
      fresh: messages.filter((message) => message.status === 'new').length,
      contacted: messages.filter((message) => message.status === 'contacted').length,
      closed: messages.filter((message) => message.status === 'closed').length,
    }),
    [messages],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (filter !== 'all' && message.status !== filter) return false;
      if (!needle) return true;
      return [message.full_name, message.email, message.phone, message.company, message.service_interest, message.message]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [messages, query, filter]);

  const fetchMessages = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setMessages((data || []).map((row) => normalize(row as Record<string, unknown>)));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Could not load messages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const openMessage = (message: Inquiry) => {
    setSelectedId(message.id);
    setActionError(null);
    setMobileOpen(true);
  };

  const updateMessageStatus = async (id: string, status: string) => {
    setSavingStatus(status);
    setActionError(null);
    try {
      const { error: updateError } = await supabase.from('inquiries').update({ status }).eq('id', id);
      if (updateError) throw updateError;
      setMessages((current) => current.map((message) => (message.id === id ? { ...message, status } : message)));
    } catch (err) {
      console.error('Error updating message status:', err);
      setActionError('Could not update this message.');
    } finally {
      setSavingStatus(null);
    }
  };

  const deleteMessage = async () => {
    if (!selected) return;
    setDeleting(true);
    setActionError(null);
    try {
      const { error: deleteError } = await supabase.from('inquiries').delete().eq('id', selected.id);
      if (deleteError) throw deleteError;
      setMessages((current) => current.filter((message) => message.id !== selected.id));
      setSelectedId(null);
      setMobileOpen(false);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting message:', err);
      setActionError('Could not delete this message.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Inbox</p>
          <h1 className="mt-2 font-admin text-3xl tracking-tight text-ink-deep">Messages</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Read quote requests, mark what you have answered, and reply by email or phone.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => fetchMessages(true)} disabled={loading || refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <section className="mb-8">
        {loading && messages.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-paper-2" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.45fr)_1fr_1fr_1fr]">
            <div className="panel-dark p-6 text-paper">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">New</p>
              <p className="mt-3 font-admin text-4xl tracking-tight">{counts.fresh}</p>
              <p className="mt-2 text-sm text-paper/70">Waiting for a reply</p>
            </div>
            <Stat label="All" value={String(counts.all)} hint="In the inbox" />
            <Stat label="Contacted" value={String(counts.contacted)} hint="A reply was started" />
            <Stat label="Closed" value={String(counts.closed)} hint="Finished" />
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:p-5">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or message"
              className="w-full rounded-xl border border-rule bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-gold focus:ring-1 focus:ring-gold/40"
            />
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide" role="group" aria-label="Filter messages">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200 ${
                  filter === item.value ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            {visible.length === messages.length ? `${messages.length} messages` : `${visible.length} of ${messages.length}`}
          </p>

          <div className="mt-3 max-h-[calc(100dvh-280px)] space-y-2 overflow-y-auto pr-1">
            {loading && messages.length === 0 && (
              <div className="space-y-2">
                <div className="h-20 animate-pulse rounded-xl bg-paper-2" />
                <div className="h-20 animate-pulse rounded-xl bg-paper-2" />
                <div className="h-20 animate-pulse rounded-xl bg-paper-2" />
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-rule px-6 py-10 text-center">
                <p className="font-medium text-ink-deep">No messages yet</p>
                <p className="mt-1 text-sm text-muted">Quote requests from the site land here.</p>
              </div>
            )}
            {!loading && messages.length > 0 && visible.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">Nothing matches that search.</p>
            )}
            {visible.map((message) => {
              const active = selected?.id === message.id;
              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => openMessage(message)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition duration-200 ${
                    active ? 'border-ink bg-paper' : 'border-transparent bg-paper/60 hover:border-rule hover:bg-paper'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-medium text-ink-deep">{message.full_name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] ${statusClass(message.status)}`}>
                      {statusLabel(message.status)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{message.service_interest || message.email}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/80">{message.message}</p>
                  <p className="mt-2 text-xs text-muted">{when(message.created_at)}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="hidden min-h-[420px] rounded-2xl border border-rule bg-surface p-6 shadow-[0_1px_2px_rgb(14_36_54/0.04)] lg:block">
          {selected ? (
            <MessageDetail
              message={selected}
              savingStatus={savingStatus}
              actionError={actionError}
              onStatus={(status) => updateMessageStatus(selected.id, status)}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <Mail className="text-gold" size={28} />
              <p className="mt-4 font-medium text-ink-deep">Select a message</p>
              <p className="mt-1 max-w-sm text-sm text-muted">The request, contact details, and status actions open here.</p>
            </div>
          )}
        </section>
      </div>

      {selected && mobileOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink-deep/50" aria-label="Close message" onClick={() => setMobileOpen(false)} />
          <div className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-rule bg-surface p-5 shadow-[0_-20px_50px_-30px_rgb(14_36_54/0.6)]">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1 rounded-full border border-rule px-3 py-1.5 text-sm text-ink"
              >
                <X size={14} />
                Close
              </button>
            </div>
            <MessageDetail
              message={selected}
              savingStatus={savingStatus}
              actionError={actionError}
              onStatus={(status) => updateMessageStatus(selected.id, status)}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink-deep/50" aria-label="Cancel delete" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-rule bg-surface p-6 shadow-[0_24px_60px_-30px_rgb(14_36_54/0.55)]">
            <h3 className="font-admin text-xl text-ink-deep">Delete this message?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {selected.full_name}&apos;s request will be removed from the inbox. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" onClick={deleteMessage} disabled={deleting} className="bg-red-700 border-red-700 hover:bg-red-800">
                <Trash2 size={15} />
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-surface p-5 shadow-[0_1px_2px_rgb(14_36_54/0.04)]">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-3 font-admin text-2xl tracking-tight text-ink-deep">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function MessageDetail({
  message,
  savingStatus,
  actionError,
  onStatus,
  onDelete,
}: {
  message: Inquiry;
  savingStatus: string | null;
  actionError: string | null;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const replyHref = message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.service_interest || 'Your inquiry'}`)}`
    : '';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            {message.service_interest || 'General inquiry'}
          </p>
          <h2 className="mt-2 font-admin text-2xl tracking-tight text-ink-deep">{message.full_name}</h2>
          {message.company && <p className="mt-1 text-sm text-muted">{message.company}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] ${statusClass(message.status)}`}>
          {statusLabel(message.status)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {message.email && (
          <a href={replyHref} className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1.5 text-sm text-ink transition duration-200 hover:border-ink">
            <Mail size={14} className="text-gold" />
            {message.email}
          </a>
        )}
        {message.phone && (
          <a href={`tel:${message.phone}`} className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3 py-1.5 text-sm text-ink transition duration-200 hover:border-ink">
            <Phone size={14} className="text-gold" />
            {message.phone}
          </a>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-rule bg-paper px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.message || 'No message text.'}</p>
        <p className="mt-3 text-xs text-muted">{when(message.created_at)}</p>
      </div>

      {actionError && <p className="mt-4 text-sm text-red-800">{actionError}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {(['new', 'contacted', 'closed'] as const).map((status) => {
          const current = message.status === status;
          return (
            <button
              key={status}
              type="button"
              disabled={Boolean(savingStatus) || current}
              onClick={() => onStatus(status)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition duration-200 disabled:opacity-60 ${
                current ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper text-ink hover:border-ink'
              }`}
            >
              {savingStatus === status ? 'Saving…' : statusLabel(status)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-red-800 transition duration-200 hover:bg-red-50"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
