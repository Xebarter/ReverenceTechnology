'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authJson } from '../lib/authFetch';
import { useUser } from '../UserContext';
import { Button, Card, FieldLabel, Input, Textarea } from './ui';
import { AccountPageHeader } from './account';
import type { ClientProject } from '../lib/types';

type ServiceRow = {
  id: string;
  package_name: string;
  description: string;
  suggested_pricing: string;
};

export default function CreateClientProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();
  const serviceId = searchParams?.get('service') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<ServiceRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    (async () => {
      const { data } = await supabase
        .from('services')
        .select('id,package_name,description,suggested_pricing')
        .eq('id', serviceId)
        .maybeSingle();
      if (data) {
        setService(data as ServiceRow);
        setTitle((prev) => prev || data.package_name);
        setDescription((prev) => prev || data.description || '');
      }
    })();
  }, [serviceId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }
    setBusy(true);
    try {
      const json = await authJson<{ project: ClientProject }>('/api/client-projects', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          service_id: serviceId || null,
          customer_name: user?.displayName || user?.user_metadata?.full_name || null,
          customer_phone: phone.trim() || null,
        }),
      });
      router.replace(`/dashboard/projects/${json.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        eyebrow="New project"
        title="Start a project"
        description="Tell us what you need. We’ll review it, set a total, and request installments as work proceeds."
      />
      <Card className="max-w-2xl p-6 sm:p-8">
          {service && (
            <div className="mb-6 rounded-md border border-rule bg-paper p-4 text-sm">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">Service</div>
              <div className="mt-1 font-medium text-ink-deep">{service.package_name}</div>
              <div className="mt-1 text-muted">{service.suggested_pricing}</div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <FieldLabel htmlFor="title">Project title</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Company website rebuild"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="description">What should we build?</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Goals, features, timeline, and anything we should know."
                rows={6}
              />
            </div>
            <div>
              <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256..."
              />
            </div>
            <Button type="submit" disabled={busy} size="lg" className="w-full">
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit project'
              )}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/projects')}
              className="w-full text-center text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        </Card>
    </div>
  );
}
