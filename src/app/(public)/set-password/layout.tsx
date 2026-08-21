import type { ReactNode } from 'react';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Set password', '/set-password');

export default function SetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
