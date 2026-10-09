export type DisbursementStatus = 'creating' | 'initialized' | 'pending' | 'success' | 'error';
export type DisbursementType = 'mobile' | 'bank';

export type Disbursement = {
  id: string;
  paytota_id: string | null;
  reference: string;
  payout_type: DisbursementType;
  status: DisbursementStatus;
  amount: number;
  currency: string;
  description: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  bank_name: string | null;
  bank_code: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  failure_message: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountBalance = {
  currency: string;
  balance: number;
  gross_balance: number;
  available_balance: number;
  available_payout_balance: number;
  payout_balance: number;
  pending_outgoing: number;
  pending_payouts: number;
  reserved: number;
};
