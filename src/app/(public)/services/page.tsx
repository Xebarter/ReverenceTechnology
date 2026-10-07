import { Suspense } from 'react';
import JsonLd from '../../../components/JsonLd';
import ServicesHub from '../../../components/ServicesHub';
import { Container, PageHeader } from '../../../components/ui';
import {
  breadcrumbJsonLd,
  pageMetadata,
} from '../../../lib/seo';
import { SERVICE_HUB } from '../../../lib/seoPages';

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

      <Suspense
        fallback={
          <Container className="py-16 text-muted">Loading services…</Container>
        }
      >
        <ServicesHub />
      </Suspense>
    </div>
  );
}
