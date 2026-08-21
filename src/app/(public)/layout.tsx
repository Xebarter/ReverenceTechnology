import type { ReactNode } from 'react';
import PublicChrome from '../../components/PublicChrome';
import JsonLd from '../../components/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '../../lib/seo';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <PublicChrome>{children}</PublicChrome>
    </>
  );
}
