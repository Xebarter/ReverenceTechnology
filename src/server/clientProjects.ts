import type { ClientProject, PaymentInstallment } from '../lib/types';

export function remainingBalance(project: Pick<ClientProject, 'agreed_total' | 'amount_paid'>): number | null {
  if (project.agreed_total == null) return null;
  return Math.max(0, Number(project.agreed_total) - Number(project.amount_paid || 0));
}

export function mapClientProject(row: Record<string, unknown>): ClientProject {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    service_id: row.service_id != null ? String(row.service_id) : null,
    status: (row.status as ClientProject['status']) || 'submitted',
    agreed_total: row.agreed_total != null ? Number(row.agreed_total) : null,
    amount_paid: Number(row.amount_paid || 0),
    admin_notes: row.admin_notes != null ? String(row.admin_notes) : null,
    progress_note: row.progress_note != null ? String(row.progress_note) : null,
    customer_name: row.customer_name != null ? String(row.customer_name) : null,
    customer_email: row.customer_email != null ? String(row.customer_email) : null,
    customer_phone: row.customer_phone != null ? String(row.customer_phone) : null,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

export function mapInstallment(row: Record<string, unknown>): PaymentInstallment {
  return {
    id: String(row.id),
    client_project_id: String(row.client_project_id),
    amount: Number(row.amount || 0),
    kind: (row.kind as PaymentInstallment['kind']) || 'installment',
    status: (row.status as PaymentInstallment['status']) || 'requested',
    trans_token: row.trans_token != null ? String(row.trans_token) : null,
    status_token: String(row.status_token),
    note: row.note != null ? String(row.note) : null,
    payment_reference: row.payment_reference != null ? String(row.payment_reference) : null,
    requested_at: String(row.requested_at || row.created_at || ''),
    paid_at: row.paid_at != null ? String(row.paid_at) : null,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

export function formatUgx(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
}
