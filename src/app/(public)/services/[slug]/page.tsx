import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '../../../../components/JsonLd';
import ServiceLanding from '../../../../components/ServiceLanding';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  pageMetadata,
  serviceJsonLd,
} from '../../../../lib/seo';
import { getServicePage, getServiceSlugs } from '../../../../lib/seoPages';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return { title: 'Service' };
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/services/${page.slug}`,
    keywords: page.keywords,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: page.title, path: `/services/${page.slug}` },
          ]),
          serviceJsonLd({
            name: page.title,
            description: page.description,
            path: `/services/${page.slug}`,
            serviceType: page.serviceType,
          }),
          faqJsonLd(page.faqs),
        ]}
      />
      <ServiceLanding page={page} />
    </>
  );
}
