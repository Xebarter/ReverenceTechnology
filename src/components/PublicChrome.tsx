'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import WhatsAppFab from './WhatsAppFab';

export default function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAccount = pathname?.startsWith('/dashboard');

  if (isAccount) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="pt-[4.25rem]">{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
