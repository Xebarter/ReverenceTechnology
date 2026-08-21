'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Clock, Banknote, ArrowLeft, CheckCircle2, Briefcase, Info } from 'lucide-react';
import JobApplicationForm from './JobApplicationForm';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';
import { Badge, Button, Card, Container, PageHeader } from './ui';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_range: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  is_published: boolean;
}

export default function JobDetails() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUser();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);

  useEffect(() => {
    if (id) fetchJobDetails(id);
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const shouldOpen = searchParams?.get('apply') === '1';
    if (!shouldOpen) return;
    if (authLoading) return;
    if (!user) return;
    setIsApplicationFormOpen(true);
  }, [searchParams, authLoading, user]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (err) {
      setError('Failed to load job details.');
    } finally {
      setLoading(false);
    }
  };

  const parseList = (items: any) => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try { return JSON.parse(items); } catch { return [items]; }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-paper p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="mx-auto h-12 w-2/3 animate-pulse bg-paper-2" />
          <div className="h-64 animate-pulse border border-rule bg-surface" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-paper p-6 text-center">
        <div className="max-w-md">
          <Info className="mx-auto mb-4 h-16 w-16 text-rule" />
          <h2 className="mb-2 font-serif text-2xl font-medium text-ink-deep">Oops! Job not found</h2>
          <p className="mb-8 text-muted">This position may have been filled or the link has expired.</p>
          <Button onClick={() => router.push('/careers')}>
            View All Openings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper pb-24">
      <PageHeader
        eyebrow="Careers"
        title={job.title}
        description={
          <span className="mt-2 flex flex-wrap gap-3">
            <Badge>
              <MapPin size={14} className="text-gold" /> {job.location}
            </Badge>
            <Badge>
              <Clock size={14} className="text-gold" /> {job.employment_type}
            </Badge>
            {job.salary_range && (
              <Badge>
                <Banknote size={14} className="text-gold" /> {job.salary_range}
              </Badge>
            )}
          </span>
        }
      />

      <Container className="py-10">
        <button
          onClick={() => router.push('/careers')}
          className="mb-8 flex items-center text-sm font-medium uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Careers
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="p-8 md:p-12">
              <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl font-medium text-ink-deep">
                <Briefcase className="text-gold" /> Role Overview
              </h2>
              <p className="whitespace-pre-line text-lg leading-relaxed text-muted">
                {job.description}
              </p>

              <hr className="my-10 border-rule" />

              <div className="space-y-10">
                <section>
                  <h3 className="mb-6 font-serif text-xl font-medium text-ink-deep">Key Responsibilities</h3>
                  <div className="grid gap-4">
                    {parseList(job.responsibilities).map((item: string, i: number) => (
                      <div key={i} className="flex gap-4 border border-rule bg-paper p-4">
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-gold" />
                        <span className="font-medium text-ink">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-6 font-serif text-xl font-medium text-ink-deep">Requirements</h3>
                  <div className="grid gap-3">
                    {parseList(job.requirements).map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        <span className="leading-relaxed text-muted">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </Card>

            <div className="border border-rule bg-ink-deep p-10 text-paper">
              <h2 className="mb-6 font-serif text-2xl font-medium">About Reverence Technology</h2>
              <p className="mb-6 text-lg leading-relaxed text-paper/70">
                We are a hub of innovation in Kampala, building technology that matters for East Africa.
                Join a culture of excellence, ownership, and digital transformation.
              </p>
              <div className="flex gap-4">
                <div className="rounded-md border border-paper/15 px-4 py-2 text-sm font-medium">Innovation First</div>
                <div className="rounded-md border border-paper/15 px-4 py-2 text-sm font-medium">Local Impact</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="p-8">
                <h3 className="mb-6 font-serif text-lg font-medium text-ink-deep">What We Offer</h3>
                <div className="mb-8 space-y-4">
                  {parseList(job.benefits).map((benefit: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-muted">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rule bg-paper text-gold">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-sm font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (authLoading) return;
                    if (!user) {
                      const redirect = `/job/${job.id}?apply=1`;
                      router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
                      return;
                    }
                    setIsApplicationFormOpen(true);
                  }}
                >
                  Apply for this Role
                </Button>
                <p className="mt-4 text-center text-xs font-medium text-muted">
                  Takes less than 3 minutes to apply
                </p>
              </Card>

              <div className="border border-rule bg-paper-2 p-8">
                <h4 className="mb-2 font-serif font-medium text-ink-deep">Have Questions?</h4>
                <p className="mb-4 text-sm text-muted">Contact our recruitment team for more details about our hiring process.</p>
                <a href="mailto:careers@reverencetechnology.com" className="text-sm font-medium text-ink underline decoration-gold underline-offset-4">
                  careers@reverencetechnology.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {isApplicationFormOpen && (
        <JobApplicationForm
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setIsApplicationFormOpen(false)}
          onSubmitSuccess={() => setIsApplicationFormOpen(false)}
        />
      )}
    </div>
  );
}
