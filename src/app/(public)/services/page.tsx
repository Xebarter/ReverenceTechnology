import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import JsonLd from '../../../components/JsonLd';
import { buttonClassName, Card, Container, PageHeader } from '../../../components/ui';
import {
  breadcrumbJsonLd,
  pageMetadata,
} from '../../../lib/seo';
import { SERVICE_HUB, SERVICE_PAGES } from '../../../lib/seoPages';

export const metadata = pageMetadata({
  title: SERVICE_HUB.title,
  description: SERVICE_HUB.description,
  path: '/services',
  keywords: [
    'software development services Uganda',
    'web development Kampala',
    'mobile app development Uganda',
    'custom software company Uganda',
  ],
});

export default function ServicesHubPage() {
  return (
    <div className="bg-paper pb-24">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ])}
      />
      <PageHeader eyebrow="Services" title={SERVICE_HUB.h1} description={SERVICE_HUB.intro} />

      <Container className="py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICE_PAGES.map((page) => (
            <Link key={page.slug} href={`/services/${page.slug}`} className="group">
              <Card className="hover-lift flex h-full flex-col p-8">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  {page.eyebrow}
                </p>
                <h2 className="mt-4 font-serif text-2xl font-medium tracking-tight text-ink-deep">{page.title}</h2>
                <p className="mt-3 flex-1 leading-relaxed text-muted">{page.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink">
                  Learn more <ArrowRight size={14} className="text-gold transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="panel-dark mt-16 px-8 py-12 text-paper md:px-12">
          <h2 className="font-serif text-3xl font-medium tracking-tight">Ready when you are.</h2>
          <p className="mt-3 max-w-xl text-paper/70">
            Brief a project with the outcome you need. We will come back with an approach, a timeline, and a quoted
            total.
          </p>
          <Link
            href="/dashboard/projects/new"
            className={buttonClassName('primary', 'lg', 'mt-8 bg-paper text-ink-deep border-paper hover:bg-paper-2')}
          >
            Start a project
          </Link>
        </div>
      </Container>
    </div>
  );
}
