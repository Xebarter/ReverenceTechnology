'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Loader2, Plus } from 'lucide-react';
import { authJson } from '../lib/authFetch';
import { useUser } from '../UserContext';
import { formatUgx, remainingBalance } from '../lib/projectMoney';
import type { ClientProject } from '../lib/types';
import { Button, Card } from './ui';
import { AccountPageHeader, StatusBadge } from './account';

export default function MyProjectsList() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const data = await authJson<{ projects: ClientProject[] }>('/api/client-projects');
        setProjects(data.projects || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load projects.');
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);

  if (loading || busy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading projects...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <AccountPageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Track progress, see payment requests, and pay an installment or the remaining balance."
        actions={
          <Button onClick={() => router.push('/dashboard/projects/new')} size="sm">
            <Plus size={16} />
            Start a project
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {projects.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <Info className="mx-auto mb-3 h-8 w-8 text-rule" />
          <div className="font-serif text-lg text-ink-deep">No projects yet</div>
          <p className="mx-auto mb-6 mt-1 max-w-md text-sm text-muted">
            Submit a brief and we’ll follow up with a quote and payment schedule.
          </p>
          <Button onClick={() => router.push('/dashboard/projects/new')} size="sm">
            Start a project
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-rule bg-paper px-5 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:grid">
            <span>Project</span>
            <span>Balance</span>
            <span className="text-right">Status</span>
          </div>
          <div className="divide-y divide-rule">
            {projects.map((p) => {
              const remaining = remainingBalance(p);
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                  className="grid w-full grid-cols-1 items-center gap-2 px-5 py-4 text-left hover:bg-paper sm:grid-cols-[1fr_auto_auto] sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-deep">{p.title}</div>
                    <div className="mt-0.5 text-sm text-muted">{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm tabular-nums text-ink">
                    {p.agreed_total != null
                      ? remaining != null && remaining > 0
                        ? `${formatUgx(remaining)} left`
                        : 'Paid in full'
                      : 'Awaiting quote'}
                  </div>
                  <div className="sm:text-right">
                    <StatusBadge status={p.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
