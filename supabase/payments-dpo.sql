-- ============================================================
-- DPO Pay by Network — Payment Integration Migration
-- Reverence Technology Shop
-- ============================================================
--
-- Run this in the Supabase SQL Editor (once) on any environment
-- that does not yet have the DPO columns on public.orders.
--
-- The individual changes below are covered by these migration files
-- (already applied if you ran migrations in order):
--   20260327000100_add_dpo_payment_method_to_orders.sql
--   20260409000100_add_order_status_token.sql
--   20260409200000_add_trans_token_to_orders.sql
--
-- This file consolidates them for convenience and idempotency.
-- ============================================================

-- 1. Allow 'dpo' as a valid payment_method value.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('dpo', 'mobile_money', 'bank_transfer', 'cash', 'other'));

-- 2. Add status_token: a per-order secret the customer uses to poll payment
--    status without requiring authentication (avoids RLS issues on the
--    /payment-result page).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status_token text;

CREATE INDEX IF NOT EXISTS idx_orders_status_token
  ON public.orders (status_token)
  WHERE status_token IS NOT NULL;

-- 3. Add trans_token: stores DPO's TransToken so the server can call
--    verifyToken directly when the BackURL callback hasn't fired yet.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS trans_token text;

CREATE INDEX IF NOT EXISTS idx_orders_trans_token
  ON public.orders (trans_token)
  WHERE trans_token IS NOT NULL;

-- 4. Ensure payment_status has the correct CHECK constraint and default.
--    (payment_status already exists from the original orders table migration.)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending';
