import type { Metadata } from 'next';

export const SITE_NAME = 'Reverence Technology';

export const NAP = {
  legalName: 'Reverence Technology Uganda Limited',
  name: 'Reverence Technology',
  streetAddress: 'Mutungo, Zone 1',
  city: 'Kampala',
  region: 'Kampala',
  postalCode: '',
  country: 'UG',
  countryName: 'Uganda',
  phone: '+256783676313',
  phoneDisplay: '+256 783 676 313',
  email: 'reverencetech1@gmail.com',
  hours: 'Mo-Fr 09:00-17:00',
} as const;

const FALLBACK_ORIGIN = 'https://www.reverencetechnology.com';

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    FALLBACK_ORIGIN;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProto);
    if (url.hostname === 'reverencetechnology.com') {
      url.hostname = 'www.reverencetechnology.com';
    }
    return url.origin.replace(/\/+$/, '');
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export function absoluteUrl(path = '/'): string {
  const site = getSiteUrl();
  if (!path || path === '/') return `${site}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${site}${normalized}`;
}

export const DEFAULT_OG_IMAGE = '/logo.svg';

const HOME_TITLE = 'Software Development Company in Uganda | Reverence Technology';
const HOME_DESCRIPTION =
  'Reverence Technology is a software development company in Kampala, Uganda. Custom software, websites, mobile apps, and business systems for East Africa.';

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  index?: boolean;
  keywords?: string[];
};

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  index = true,
  keywords,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image
    ? image.startsWith('http')
      ? image
      : absoluteUrl(image)
    : absoluteUrl(DEFAULT_OG_IMAGE);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_UG',
      images: [{ url: ogImage, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export function noIndexMetadata(title: string, path: string): Metadata {
  return pageMetadata({
    title,
    description: `${title} on ${SITE_NAME}.`,
    path,
    index: false,
  });
}

export function rootMetadata(): Metadata {
  const site = getSiteUrl();
  return {
    metadataBase: new URL(site),
    title: {
      default: HOME_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: site }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'technology',
    keywords: [
      'Reverence Technology',
      'software development Uganda',
      'software development company Uganda',
      'web development Kampala',
      'mobile app development Uganda',
      'custom software Kampala',
    ],
    alternates: { canonical: `${site}/` },
    robots: { index: true, follow: true },
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: `${site}/`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_UG',
      images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
    icons: {
      icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/logo.svg' }],
    },
    manifest: '/site.webmanifest',
  };
}

export function organizationJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService', 'LocalBusiness'],
    '@id': `${site}/#organization`,
    name: NAP.name,
    legalName: NAP.legalName,
    url: site,
    logo: absoluteUrl('/logo.svg'),
    image: absoluteUrl('/logo.svg'),
    email: NAP.email,
    telephone: NAP.phoneDisplay,
    foundingLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: NAP.city,
        addressCountry: NAP.country,
      },
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: NAP.streetAddress,
      addressLocality: NAP.city,
      addressRegion: NAP.region,
      addressCountry: NAP.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 0.3476,
      longitude: 32.5825,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
    areaServed: [
      { '@type': 'Country', name: 'Uganda' },
      { '@type': 'AdministrativeArea', name: 'East Africa' },
    ],
    sameAs: [],
    priceRange: '$$',
  };
}

export function websiteJsonLd() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    name: SITE_NAME,
    url: site,
    publisher: { '@id': `${site}/#organization` },
    inLanguage: 'en-UG',
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}) {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@id': `${site}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'Uganda' },
      { '@type': 'City', name: 'Kampala' },
    ],
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  author?: string | null;
}) {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image
      ? input.image.startsWith('http')
        ? input.image
        : absoluteUrl(input.image)
      : absoluteUrl(DEFAULT_OG_IMAGE),
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
    author: {
      '@type': 'Person',
      name: input.author || SITE_NAME,
    },
    publisher: { '@id': `${site}/#organization` },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function jobJsonLd(input: {
  title: string;
  description: string;
  path: string;
  location?: string | null;
  employmentType?: string | null;
  datePosted?: string | null;
}) {
  const site = getSiteUrl();
  const employment =
    input.employmentType?.toUpperCase().replace(/\s+/g, '_') || 'FULL_TIME';
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePosted: input.datePosted || undefined,
    employmentType: employment,
    hiringOrganization: { '@id': `${site}/#organization` },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: input.location || NAP.city,
        addressCountry: NAP.country,
      },
    },
  };
}
