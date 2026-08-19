'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';
import { ArrowRight, Briefcase, FileText, FolderOpen, Info, Loader2, ShoppingBag, Wrench } from 'lucide-react';
import { Button, Card } from './ui';
import { AccountPageHeader, StatusBadge } from './account';
import { authJson } from '../lib/authFetch';
import type { ClientProject } from '../lib/types';

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  payment_status: string | null;
  order_status: string | null;
  total_amount: number;
  items: any;
};

type JobAppRow = {
  id: string;
  created_at: string;
  status: string | null;
  jobs?: { id: string; title: string; location: string | null } | null;
};

function isServiceOrder(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((it) => it && typeof it === 'object' && (it as any).category === 'service');
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [busy, setBusy] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [apps, setApps] = useState<JobAppRow[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setBusy(true);
      setError(null);
      try {
        const [ordersRes, appsRes, projectsRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id,order_number,created_at,payment_status,order_status,total_amount,items')
            .order('created_at', { ascending: false })
            .limit(20),
          authJson<{ applications: JobAppRow[] }>('/api/job-applications').catch(() => ({ applications: [] })),
          authJson<{ projects: ClientProject[] }>('/api/client-projects').catch(() => ({ projects: [] })),
        ]);

        if (ordersRes.error) throw ordersRes.error;

        setOrders((ordersRes.data as any) || []);
        setApps(appsRes.applications || []);
        setProjects(projectsRes.projects || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard.');
      } finally {
        setBusy(false);
      }
    };
    load();
  }, [user]);

  if (loading || busy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  const paidServiceOrders = orders.filter((o) => isServiceOrder(o.items) && o.payment_status === 'paid');
  const otherOrders = orders.filter((o) => !isServiceOrder(o.items));

  return (
    <div className="space-y-8">
      <AccountPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of your projects, services, orders, and job applications."
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-4">
        <StatCard title="Projects" value={projects.length} icon={<FolderOpen size={18} />} />
        <StatCard title="Paid services" value={paidServiceOrders.length} icon={<Wrench size={18} />} />
        <StatCard title="Orders" value={otherOrders.length} icon={<ShoppingBag size={18} />} />
        <StatCard title="Applications" value={apps.length} icon={<Briefcase size={18} />} />
      </div>

      <Card className="overflow-hidden">
        <SectionHead
          icon={<FolderOpen size={18} />}
          title="Projects"
          onViewAll={() => router.push('/dashboard/projects')}
        />
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            desc="Start from a service package or submit your own brief. Payments are requested as installments."
            actionLabel="Start a project"
            onAction={() => router.push('/dashboard/projects/new')}
          />
        ) : (
          <div className="divide-y divide-rule">
            {projects.slice(0, 6).map((p) => (
              <RowCard
                key={p.id}
                title={p.title}
                meta={new Date(p.created_at).toLocaleDateString()}
                badge={p.status}
                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <SectionHead icon={<Wrench size={18} />} title="Services" onViewAll={() => router.push('/orders')} />
          {paidServiceOrders.length === 0 ? (
            <EmptyState
              title="No paid services yet"
              desc="After you pay for a service, it will appear here."
              actionLabel="Browse services"
              onAction={() => router.push('/#services')}
            />
          ) : (
            <div className="divide-y divide-rule">
              {paidServiceOrders.slice(0, 6).map((o) => (
                <RowCard
                  key={o.id}
                  title={String((Array.isArray(o.items) ? o.items[0]?.product_name : '') || 'Service')}
                  meta={`Order ${o.order_number} · ${new Date(o.created_at).toLocaleDateString()}`}
                  badge={o.order_status || 'processing'}
                  onClick={() => router.push(`/orders?order=${encodeURIComponent(o.order_number)}`)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <SectionHead
            icon={<Briefcase size={18} />}
            title="Applications"
            onViewAll={() => router.push('/dashboard/applications')}
          />
          {apps.length === 0 ? (
            <EmptyState
              title="No applications yet"
              desc="Apply for a role to start tracking it here."
              actionLabel="View careers"
              onAction={() => router.push('/careers')}
            />
          ) : (
            <div className="divide-y divide-rule">
              {apps.slice(0, 6).map((a) => (
                <RowCard
                  key={a.id}
                  title={a.jobs?.title || 'Job'}
                  meta={`${new Date(a.created_at).toLocaleDateString()}${a.jobs?.location ? ` · ${a.jobs.location}` : ''}`}
                  badge={a.status || 'new'}
                  onClick={() => router.push('/dashboard/applications')}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MiniCTA
          title="Start a project"
          desc="Submit a brief. We’ll quote a total and request installments as work progresses."
          action="New project"
          icon={<FolderOpen size={18} />}
          onClick={() => router.push('/dashboard/projects/new')}
        />
        <MiniCTA
          title="Track a shop order"
          desc="Use order tracking if you checked out without signing in."
          action="Open tracking"
          icon={<FileText size={18} />}
          onClick={() => router.push('/orders')}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <div className="bg-surface p-5">
      <div className="mb-3 text-ink">{icon}</div>
      <div className="font-serif text-3xl tabular-nums text-ink-deep">{value}</div>
      <div className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{title}</div>
    </div>
  );
}

function SectionHead({ icon, title, onViewAll }: { icon: ReactNode; title: string; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-rule px-5 py-4">
      <div className="flex items-center gap-2.5 text-ink-deep">
        <span className="text-gold">{icon}</span>
        <h2 className="font-serif text-lg">{title}</h2>
      </div>
      <button onClick={onViewAll} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        View all <ArrowRight size={14} />
      </button>
    </div>
  );
}

function RowCard({
  title,
  meta,
  badge,
  onClick,
}: {
  title: string;
  meta: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper">
      <div className="min-w-0">
        <div className="truncate font-medium text-ink-deep">{title}</div>
        <div className="mt-0.5 text-sm text-muted">{meta}</div>
      </div>
      <StatusBadge status={badge} className="shrink-0" />
    </button>
  );
}

function EmptyState({
  title,
  desc,
  actionLabel,
  onAction,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <Info className="mx-auto mb-3 h-8 w-8 text-rule" />
      <div className="font-serif text-lg text-ink-deep">{title}</div>
      <div className="mx-auto mb-5 mt-1 max-w-sm text-sm text-muted">{desc}</div>
      <Button onClick={onAction} size="sm">
        {actionLabel}
      </Button>
    </div>
  );
}

function MiniCTA({
  title,
  desc,
  action,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  action: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col border border-rule bg-surface p-6">
      <div className="mb-3 text-gold">{icon}</div>
      <div className="font-serif text-lg text-ink-deep">{title}</div>
      <p className="mb-5 mt-1 flex-1 text-sm leading-relaxed text-muted">{desc}</p>
      <Button onClick={onClick} size="sm" variant="secondary">
        {action}
      </Button>
    </div>
  );
}
