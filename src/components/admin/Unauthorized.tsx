'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '../../UserContext';
import { Button, Card } from '../ui';

export default function Unauthorized() {
  const router = useRouter();
  const { signOut } = useUser();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/auth');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12 font-admin">
      <Card className="w-full max-w-md p-8 md:p-10">
        <h1 className="text-center font-admin text-3xl text-ink-deep">Access denied</h1>
        <p className="mt-2 mb-6 text-center text-sm text-muted">
          You do not have permission to access the admin dashboard.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-ink">
          Your account is not authorized to access the admin panel. Please contact an administrator
          to grant you access, or sign in with an authorized account.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
          <Button variant="secondary" onClick={() => router.push('/')} className="w-full">
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
