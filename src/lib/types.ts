export type ClientProjectStatus =
  | 'submitted'
  | 'in_review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ClientProject = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  service_id: string | null;
  status: ClientProjectStatus;
  agreed_total: number | null;
  amount_paid: number;
  admin_notes: string | null;
  progress_note: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentInstallmentKind = 'installment' | 'balance';
export type PaymentInstallmentStatus = 'requested' | 'paid' | 'cancelled';

export type PaymentInstallment = {
  id: string;
  client_project_id: string;
  amount: number;
  kind: PaymentInstallmentKind;
  status: PaymentInstallmentStatus;
  trans_token: string | null;
  status_token: string;
  note: string | null;
  payment_reference: string | null;
  requested_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
