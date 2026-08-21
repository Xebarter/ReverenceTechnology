import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata: Metadata = noIndexMetadata('Sign in', '/auth');

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
