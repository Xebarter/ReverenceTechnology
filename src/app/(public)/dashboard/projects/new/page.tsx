import { Suspense } from 'react';
import CreateClientProject from '../../../../../components/CreateClientProject';

export default function DashboardNewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted">Loading...</div>
      }
    >
      <CreateClientProject />
    </Suspense>
  );
}
