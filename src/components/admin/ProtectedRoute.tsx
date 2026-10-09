'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../UserContext';
import AdminAuth from './Auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && !isAdmin) router.replace('/unauthorized');
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-ink" />
        <span className="ml-3 text-sm">Opening admin…</span>
      </div>
    );
  }

  if (!user) {
    return <AdminAuth />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-ink" />
        <span className="ml-3">Checking access...</span>
      </div>
    );
  }

  return <>{children}</>;
}
