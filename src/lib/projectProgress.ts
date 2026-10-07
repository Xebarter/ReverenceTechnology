import type { ClientProject, ClientProjectStatus, PaymentInstallment } from './types';

export const MIN_DEPOSIT_UGX = 1000;

export const PROJECT_STAGES: { id: ClientProjectStatus; label: string; detail: string }[] = [
  { id: 'submitted', label: 'Submitted', detail: 'Brief received' },
  { id: 'in_review', label: 'In review', detail: 'Quote and scope' },
  { id: 'active', label: 'In progress', detail: 'Work underway' },
  { id: 'completed', label: 'Complete', detail: 'Delivered' },
];

export function stageIndex(status: ClientProjectStatus): number {
  if (status === 'paused') return 2;
  if (status === 'cancelled') return -1;
  const index = PROJECT_STAGES.findIndex((stage) => stage.id === status);
  return index < 0 ? 0 : index;
}

export function statusSummary(status: ClientProjectStatus): string {
  switch (status) {
    case 'submitted':
      return 'Your brief is in. A total is set after review, and then you can deposit toward the project.';
    case 'in_review':
      return 'Scope and pricing are in review. Deposits open once a total is agreed.';
    case 'active':
      return 'Work is underway. Deposit any amount up to the balance, and follow updates here.';
    case 'paused':
      return 'Work is paused. Progress and payments stay available on this page.';
    case 'completed':
      return 'This project is complete. Payment history and the final update stay here.';
    case 'cancelled':
      return 'This project was cancelled. Earlier payments remain on the record.';
  }
}

export function paymentPercent(project: Pick<ClientProject, 'agreed_total' | 'amount_paid'>): number | null {
  const total = project.agreed_total != null ? Number(project.agreed_total) : null;
  if (total == null || total <= 0) return null;
  return Math.min(100, Math.round((Number(project.amount_paid || 0) / total) * 100));
}

/** Abandoned checkouts the client can replace with a new deposit. */
export function isReplaceableCheckout(
  installment: Pick<PaymentInstallment, 'note' | 'trans_token' | 'status'>,
): boolean {
  if (installment.status !== 'requested') return false;
  if (installment.trans_token) return false;
  return installment.note === 'Deposit' || installment.note === 'Pay remaining balance';
}

export function heldAmount(installments: PaymentInstallment[]): number {
  return installments
    .filter((item) => item.status === 'requested' && !isReplaceableCheckout(item))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function depositCeiling(remaining: number, installments: PaymentInstallment[]): number {
  return Math.max(0, Math.round(remaining - heldAmount(installments)));
}

export function minimumDeposit(ceiling: number): number {
  if (ceiling <= 0) return 0;
  return ceiling < MIN_DEPOSIT_UGX ? Math.round(ceiling) : MIN_DEPOSIT_UGX;
}

export function depositPresets(ceiling: number): { label: string; amount: number }[] {
  const min = minimumDeposit(ceiling);
  const full = Math.round(ceiling);
  const raw = [
    { label: '25%', amount: Math.round(ceiling * 0.25) },
    { label: '50%', amount: Math.round(ceiling * 0.5) },
    { label: '75%', amount: Math.round(ceiling * 0.75) },
    { label: 'Full', amount: full },
  ];
  const seen = new Set<number>();
  return raw.filter((preset) => {
    if (preset.amount < min || preset.amount > full) return false;
    if (seen.has(preset.amount)) return false;
    seen.add(preset.amount);
    return true;
  });
}

export function parseDepositAmount(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return NaN;
  return Math.round(Number(digits));
}
