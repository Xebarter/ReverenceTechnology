import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AccountShell from '../../../components/AccountShell';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata: Metadata = noIndexMetadata('Dashboard', '/dashboard');

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
