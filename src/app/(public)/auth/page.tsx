import { Suspense } from 'react';
import AuthPage from '../../../components/AuthPage';

export default function Auth() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <AuthPage />
    </Suspense>
  );
}
