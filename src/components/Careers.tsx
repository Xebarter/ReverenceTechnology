'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  DollarSign,
  ArrowRight,
  Briefcase,
  Zap,
  Globe,
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Button, Card, Container, Input, PageHeader, Select } from './ui';

type Job = {
  id: string;
  title?: string | null;
  location?: string | null;
  employment_type?: string | null;
  salary_range?: string | null;
  description?: string | null;
  responsibilities?: string[] | null;
  created_at?: string | null;
};

function formatPostedDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
}

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [employmentType, setEmploymentType] = useState<'all' | string>('all');
  const [location, setLocation] = useState<'all' | string>('all');
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const employmentTypeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const j of jobs) {
      const t = (j.employment_type || '').trim();
      if (t) types.add(t);
    }
    return ['all', ...Array.from(types).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const locs = new Set<string>();
    for (const j of jobs) {
      const l = (j.location || '').trim();
      if (l) locs.add(l);
    }
    return ['all', ...Array.from(locs).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (employmentType !== 'all' && (job.employment_type || '') !== employmentType) return false;
      if (location !== 'all' && (job.location || '') !== location) return false;
      if (!q) return true;

      const haystack = [
        job.title,
        job.location,
        job.employment_type,
        job.salary_range,
        job.description,
        ...(job.responsibilities || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [jobs, query, employmentType, location]);

  const SkeletonCard = () => (
    <div className="animate-pulse border border-rule bg-surface p-6">
      <div className="mb-4 h-6 w-3/4 bg-paper-2" />
      <div className="space-y-3">
        <div className="h-4 w-1/2 bg-paper-2" />
        <div className="h-4 w-1/3 bg-paper-2" />
      </div>
      <div className="mt-6 h-12 w-full bg-paper-2" />
    </div>
  );

  return (
    <div className="bg-paper">
      <PageHeader
        eyebrow="Careers"
        title="Build products that matter."
        description="Join Reverence Technology and help deliver reliable software for businesses across East Africa—fast, secure, and built to last."
      />

      <Container className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 border border-rule bg-surface p-4 md:p-5"
        >
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12 md:gap-4">
            <div className="md:col-span-6">
              <label className="sr-only" htmlFor="job-search">
                Search roles
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="job-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, skill, or keyword…"
                  className="h-12 pl-11 pr-11"
                />
                {query.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="sr-only" htmlFor="employmentType">
                Employment type
              </label>
              <div className="relative">
                <SlidersHorizontal size={16} className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted" />
                <Select
                  id="employmentType"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="h-12 pl-10"
                >
                  {employmentTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t === 'all' ? 'All types' : t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="sr-only" htmlFor="location">
                Location
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted" />
                <Select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12 pl-10"
                >
                  {locationOptions.map((l) => (
                    <option key={l} value={l}>
                      {l === 'all' ? 'All locations' : l}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted">
              <Briefcase size={18} className="text-gold" />
              <span>
                {loading ? 'Loading roles…' : `${filteredJobs.length} of ${jobs.length} roles`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(employmentType !== 'all' || location !== 'all' || query.trim()) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEmploymentType('all');
                    setLocation('all');
                    setQuery('');
                  }}
                >
                  Reset filters <X size={16} />
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  const el = document.getElementById('open-roles');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Explore roles <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-10 md:mb-12">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Working here</p>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-ink-deep md:text-3xl">A team built for delivery</h2>
          <p className="mt-3 max-w-2xl text-muted">
            We care about craft, velocity, and trust. You’ll work with clear priorities, strong feedback loops, and a calm, professional environment.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:mb-24 md:grid-cols-3 md:gap-8">
          <CultureCard
            icon={<Zap className="text-gold" />}
            title="High Impact"
            desc="Your code and designs directly affect the lives of thousands across the region."
          />
          <CultureCard
            icon={<Globe className="text-gold" />}
            title="Remote Friendly"
            desc="We value output over hours. Work from where you are most inspired."
          />
          <CultureCard
            icon={<Heart className="text-gold" />}
            title="Whole Human Care"
            desc="Competitive salaries, health benefits, and a culture that respects your time."
          />
        </div>

        <div id="open-roles" className="mb-8 flex scroll-mt-28 flex-col justify-between gap-4 border-b border-rule pb-6 md:mb-10 md:flex-row md:items-end md:pb-8">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-deep md:text-3xl">Open positions</h2>
            <p className="text-muted">Explore roles and apply in minutes.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <Briefcase size={18} />
            <span>{loading ? 'Loading…' : `${filteredJobs.length} roles available`}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="px-6 py-16 text-center md:py-20">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-rule bg-paper">
              <Search className="text-rule" size={26} />
            </div>
            <p className="font-serif text-xl font-medium tracking-tight text-ink-deep">No matching roles</p>
            <p className="mx-auto mt-2 max-w-xl text-muted">
              Try a different search term, or reset filters to see all open positions.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => {
                  setEmploymentType('all');
                  setLocation('all');
                  setQuery('');
                }}
              >
                Reset filters
              </Button>
              <a
                href="mailto:reverencetech1@gmail.com?subject=Career%20opportunities"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-rule px-5 py-2.5 text-sm font-medium text-ink hover:border-ink hover:bg-surface"
              >
                Send your CV
              </a>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                className="group flex cursor-pointer flex-col justify-between border border-rule bg-surface p-7 md:p-8"
                onClick={() => router.push(`/job/${job.id}`)}
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className="font-serif text-xl font-medium tracking-tight text-ink-deep md:text-2xl">
                      {job.title || 'Untitled role'}
                    </h3>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-md border border-rule bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink">
                        {job.employment_type || 'Role'}
                      </span>
                      {formatPostedDate(job.created_at) && (
                        <span className="text-[11px] text-muted">Posted {formatPostedDate(job.created_at)}</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-4">
                    <div className="flex items-center text-sm font-medium text-muted">
                      <MapPin size={16} className="mr-1.5" />
                      {job.location || 'Location flexible'}
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center text-sm font-medium text-muted">
                        <DollarSign size={16} className="mr-1.5" />
                        {job.salary_range}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    {job.description ? (
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted">
                        {job.description}
                      </p>
                    ) : (
                      <p className="mb-4 text-sm leading-relaxed text-muted">
                        Open role at Reverence Technology.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(job.responsibilities || []).slice(0, 2).map((r: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-md border border-rule bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="flex w-full items-center justify-center rounded-md bg-ink py-3.5 font-medium text-paper">
                  View role <ArrowRight size={18} className="ml-2" />
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function CultureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-rule bg-surface p-7 md:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-rule bg-paper">
        {icon}
      </div>
      <h3 className="mb-2 font-serif text-lg font-medium tracking-tight text-ink-deep">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
