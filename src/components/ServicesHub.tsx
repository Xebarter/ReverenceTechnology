'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Search } from 'lucide-react';
import { SERVICE_PAGES } from '../lib/seoPages';
import { useUser } from '../UserContext';
import { buttonClassName, Card, Container } from './ui';

export default function ServicesHub() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useUser();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? 'all');

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const page of SERVICE_PAGES) seen.add(page.eyebrow);
    return ['all', ...seen];
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) next.set('q', trimmed);
    if (category !== 'all' && categories.includes(category)) next.set('category', category);
    const serialized = next.toString();
    const current = params.toString();
    if (serialized === current) return;
    router.replace(serialized ? `/services?${serialized}` : '/services', { scroll: false });
  }, [query, category, categories, params, router]);

  const activeCategory = categories.includes(category) ? category : 'all';

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SERVICE_PAGES.filter((page) => {
      if (activeCategory !== 'all' && page.eyebrow !== activeCategory) return false;
      if (!needle) return true;
      const haystack = [
        page.title,
        page.eyebrow,
        page.description,
        page.intro,
        ...page.capabilities.flatMap((item) => [item.title, item.body]),
        ...page.faqs.flatMap((item) => [item.question, item.answer]),
      ]
        .join(' ')
        .toLowerCase();
      return needle.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [query, activeCategory]);

  const openBrief = (slug?: string) => {
    const next = slug
      ? `/dashboard/projects/new?focus=${encodeURIComponent(slug)}`
      : '/dashboard/projects/new';
    if (loading) return;
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(next)}`);
      return;
    }
    router.push(next);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
  };

  return (
    <Container className="py-16 md:py-20">
      <div className="rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:p-5">
        <label htmlFor="service-search" className="sr-only">
          Search services
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="service-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by service, feature, or question — school fees, POS, payments…"
            className="w-full rounded-xl border border-rule bg-paper py-2.5 pl-10 pr-3.5 text-ink placeholder:text-muted/60 transition duration-200 focus:border-gold focus:ring-1 focus:ring-gold/40"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by service type">
          {categories.map((item) => {
            const selected = item === activeCategory;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ${
                  selected
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-paper text-ink hover:border-ink'
                }`}
              >
                {item === 'all' ? 'All services' : item}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">
        {results.length === SERVICE_PAGES.length
          ? `${results.length} services`
          : `${results.length} of ${SERVICE_PAGES.length} services`}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-rule bg-surface px-8 py-14 text-center">
          <p className="font-serif text-2xl text-ink-deep">Nothing matches that search.</p>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Try a broader word, or clear the filters and browse the full list.
          </p>
          <button type="button" onClick={clearFilters} className={buttonClassName('secondary', 'md', 'mt-6')}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {results.map((page) => (
            <Card key={page.slug} className="flex h-full flex-col p-8">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">{page.eyebrow}</p>
              <h2 className="mt-4 font-serif text-2xl font-medium tracking-tight text-ink-deep">{page.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{page.description}</p>
              <ul className="mt-5 space-y-2">
                {page.capabilities.slice(0, 3).map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5 text-sm text-ink">
                    <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => openBrief(page.slug)} className={buttonClassName('primary', 'md')}>
                  Brief this service
                </button>
                <Link
                  href={`/services/${page.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-ink-deep"
                >
                  Full details
                  <ArrowRight size={14} className="text-gold" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="panel-dark mt-16 px-8 py-12 text-paper md:px-12">
        <h2 className="font-serif text-3xl font-medium tracking-tight">Not sure which service fits?</h2>
        <p className="mt-3 max-w-xl text-paper/70">
          Describe the outcome. We will match it to an approach, a timeline, and a quoted total.
        </p>
        <button
          type="button"
          onClick={() => openBrief()}
          className={buttonClassName('primary', 'lg', 'mt-8 bg-paper text-ink-deep border-paper hover:bg-paper-2')}
        >
          Start a project
        </button>
      </div>
    </Container>
  );
}
