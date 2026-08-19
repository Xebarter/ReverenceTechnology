import type { ReactNode } from 'react';
import AccountShell from '../../../components/AccountShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
