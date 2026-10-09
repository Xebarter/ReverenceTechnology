/*
  Admin Paytota disbursements. Written only by server routes that hold the service role.
*/

CREATE TABLE IF NOT EXISTS public.disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paytota_id text UNIQUE,
  reference text NOT NULL UNIQUE,
  payout_type text NOT NULL CHECK (payout_type IN ('mobile', 'bank')),
  status text NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'initialized', 'pending', 'success', 'error')),
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'UGX',
  description text,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  bank_name text,
  bank_code text,
  bank_account_name text,
  bank_account_number text,
  failure_message text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disbursements_created_at ON public.disbursements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON public.disbursements (status);

ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.disbursements TO service_role;
