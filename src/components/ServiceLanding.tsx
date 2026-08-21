import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { buttonClassName, Card, Container, PageHeader, Section } from './ui';
import type { ServicePage } from '../lib/seoPages';
import { relatedServicePages } from '../lib/seoPages';

export default function ServiceLanding({ page }: { page: ServicePage }) {
  const related = relatedServicePages(page);

  return (
    <div className="bg-paper pb-24">
      <PageHeader eyebrow={page.eyebrow} title={page.h1} description={page.description} />

      <Container className="py-16 md:py-20">
        <p className="max-w-3xl text-lg leading-relaxed text-ink">{page.intro}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {page.capabilities.map((item) => (
            <Card key={item.title} className="p-8">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-deep">{item.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </Container>

      <Section
        band
        align="left"
        eyebrow="Questions"
        title="What clients usually ask"
        description="Straightforward answers before you brief a project."
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {page.faqs.map((faq) => (
            <details
              key={faq.question}
              className="group border border-rule bg-surface px-6 py-4 open:bg-paper"
            >
              <summary className="cursor-pointer list-none font-medium text-ink-deep [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-gold transition-transform group-open:rotate-90"
                  />
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {related.length > 0 && (
        <Container className="py-16">
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Related services
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink-deep md:text-4xl">
            Continue exploring
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/services/${item.slug}`} className="group">
                <Card className="h-full p-7 transition-colors group-hover:border-ink">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-3 font-serif text-xl font-medium text-ink-deep">{item.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-ink">
                    View service <ArrowRight size={14} className="text-gold" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      )}

      <Container>
        <div className="border border-rule bg-ink-deep px-8 py-14 text-paper md:px-16 md:py-20">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Start a project</p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl font-medium tracking-tight md:text-4xl">
            Tell us what you need built.
          </h2>
          <p className="mt-4 max-w-xl text-paper/70">
            We quote a total, then you pay in installments as work is delivered — or settle the balance whenever you
            choose.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/projects/new" className={buttonClassName('primary', 'lg', 'bg-paper text-ink-deep border-paper hover:bg-paper-2')}>
              Brief a project
            </Link>
            <Link href="/#contact" className={buttonClassName('secondary', 'lg', 'border-paper/30 text-paper hover:border-paper hover:bg-paper/5')}>
              Contact us
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
