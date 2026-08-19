import type { ReactNode } from 'react';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="font-admin">{children}</div>;
}
