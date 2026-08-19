import type { ClientProject } from './types';

export function remainingBalance(project: Pick<ClientProject, 'agreed_total' | 'amount_paid'>): number | null {
  if (project.agreed_total == null) return null;
  return Math.max(0, Number(project.agreed_total) - Number(project.amount_paid || 0));
}

export function formatUgx(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
}
