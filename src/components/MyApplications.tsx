'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../UserContext';
import { authJson } from '../lib/authFetch';
import { Calendar, ChevronRight, Info, Loader2, MapPin } from 'lucide-react';
import { Button, Card } from './ui';
import { AccountPageHeader, StatusBadge } from './account';

type ApplicationRow = {
  id: string;
  job_id: string;
  status: string | null;
  created_at: string;
  jobs?: { id: string; title: string; location: string | null } | null;
};

export default function MyApplications() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setBusy(true);
      setError(null);
      try {
        const data = await authJson<{ applications: ApplicationRow[] }>('/api/job-applications');
        setRows(data.applications || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load your applications.');
      } finally {
        setBusy(false);
      }
    };
    load();
  }, [user]);

  if (loading || (busy && rows.length === 0)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading applications...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <AccountPageHeader
        eyebrow="Careers"
        title="Applications"
        description="Track every role you’ve applied for and the current status of each application."
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push('/careers')}>
            Browse roles
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</div>
        )}

        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Info className="mx-auto mb-3 h-8 w-8 text-rule" />
            <h2 className="mb-1 font-serif text-lg text-ink-deep">No applications yet</h2>
            <p className="mb-6 text-sm text-muted">Browse open roles and submit your first application.</p>
            <Button onClick={() => router.push('/careers')} size="sm">
              View open roles
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/job/${r.job_id}`)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-paper"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink-deep">{r.jobs?.title || 'Job'}</span>
                    <StatusBadge status={r.status || 'new'} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {r.jobs?.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} />
                        {r.jobs.location}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="shrink-0 text-rule" size={18} />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
