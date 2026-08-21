import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { noIndexMetadata } from '../../lib/seo';

export const metadata: Metadata = noIndexMetadata('Admin', '/admin');

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="font-admin">{children}</div>;
}
