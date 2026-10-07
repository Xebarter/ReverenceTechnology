'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FolderOpen, Info, Loader2, Plus, Wallet } from 'lucide-react';
import { authJson } from '../lib/authFetch';
import { useUser } from '../UserContext';
import { formatUgx, remainingBalance } from '../lib/projectMoney';
import { paymentPercent, stageIndex, PROJECT_STAGES } from '../lib/projectProgress';
import type { ClientProject, ClientProjectStatus } from '../lib/types';
import { Button, Card } from './ui';
import { AccountPageHeader, StatusBadge } from './account';
import { PaymentMeter } from './project/ProjectProgress';

type FilterId = 'all' | 'active' | 'due' | 'done';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'due', label: 'Needs payment' },
  { id: 'done', label: 'Complete' },
];

function matchesFilter(project: ClientProject, filter: FilterId) {
  const remaining = remainingBalance(project);
  if (filter === 'active') return project.status !== 'completed' && project.status !== 'cancelled';
  if (filter === 'due') return remaining != null && remaining > 0 && project.status !== 'cancelled';
  if (filter === 'done') return project.status === 'completed';
  return true;
}

function stageLabel(status: ClientProjectStatus) {
  if (status === 'paused') return 'Paused';
  if (status === 'cancelled') return 'Cancelled';
  return PROJECT_STAGES[stageIndex(status)]?.label || status;
}

export default function MyProjectsList() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');

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

  const totals = useMemo(() => {
    let paid = 0;
    let due = 0;
    let active = 0;
    for (const project of projects) {
      paid += Number(project.amount_paid || 0);
      due += remainingBalance(project) || 0;
      if (project.status !== 'completed' && project.status !== 'cancelled') active += 1;
    }
    return { paid, due, active };
  }, [projects]);

  const visible = projects.filter((project) => matchesFilter(project, filter));

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
        description="Follow each project from brief to delivery, and deposit toward the balance whenever you’re ready."
        actions={
          <Button onClick={() => router.push('/dashboard/projects/new')} size="sm">
            <Plus size={16} />
            Start a project
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-rule bg-rule shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:grid-cols-3">
          <SummaryStat icon={<FolderOpen size={16} />} label="Active" value={String(totals.active)} />
          <SummaryStat icon={<Wallet size={16} />} label="Paid" value={formatUgx(totals.paid)} />
          <SummaryStat icon={<ArrowUpRight size={16} />} label="Outstanding" value={formatUgx(totals.due)} />
        </div>
      )}

      {projects.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <Info className="mx-auto mb-3 h-8 w-8 text-rule" />
          <div className="font-serif text-lg text-ink-deep">No projects yet</div>
          <p className="mx-auto mb-6 mt-1 max-w-md text-sm text-muted">
            Submit a brief and we’ll follow up with a quote. You can deposit toward the project once a total is set.
          </p>
          <Button onClick={() => router.push('/dashboard/projects/new')} size="sm">
            Start a project
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const count = projects.filter((project) => matchesFilter(project, item.id)).length;
              const selected = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : 'border-rule bg-surface text-ink hover:border-ink'
                  }`}
                >
                  {item.label}
                  <span className={`ml-1.5 tabular-nums ${selected ? 'text-paper/70' : 'text-muted'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <Card className="px-6 py-12 text-center">
              <div className="font-serif text-lg text-ink-deep">Nothing in this view</div>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">Try another filter to see the rest of your projects.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => router.push(`/dashboard/projects/${project.id}`)}
                  onDeposit={() => router.push(`/dashboard/projects/${project.id}?deposit=1`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-5">
      <div className="flex items-center gap-2 text-gold">{icon}</div>
      <div className="mt-3 font-serif text-2xl tabular-nums text-ink-deep sm:text-3xl">{value}</div>
      <div className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDeposit,
}: {
  project: ClientProject;
  onOpen: () => void;
  onDeposit: () => void;
}) {
  const remaining = remainingBalance(project);
  const percent = paymentPercent(project);
  const canDeposit = remaining != null && remaining > 0 && project.status !== 'cancelled';

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-[0_18px_40px_-32px_rgb(14_36_54/0.45)]">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="min-w-0 text-left">
            <div className="font-serif text-xl text-ink-deep">{project.title}</div>
            <div className="mt-1 text-sm text-muted">
              {stageLabel(project.status)} · {new Date(project.created_at).toLocaleDateString()}
            </div>
          </button>
          <StatusBadge status={project.status} />
        </div>

        {project.progress_note && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{project.progress_note}</p>
        )}

        <button type="button" onClick={onOpen} className="text-left">
          {percent != null ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>Paid {formatUgx(Number(project.amount_paid || 0))}</span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <PaymentMeter percent={percent} />
            </div>
          ) : (
            <p className="text-sm text-muted">Awaiting a quote before deposits open.</p>
          )}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
          <div className="text-sm text-ink">
            {project.agreed_total == null
              ? 'Quote pending'
              : remaining != null && remaining > 0
                ? `${formatUgx(remaining)} remaining`
                : 'Paid in full'}
          </div>
          <div className="flex gap-2">
            {canDeposit && (
              <Button size="sm" onClick={onDeposit}>
                Deposit
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onOpen}>
              Open
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
