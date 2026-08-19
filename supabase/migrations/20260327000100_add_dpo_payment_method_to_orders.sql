-- Allow DPO as an explicit payment method on orders.
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('dpo', 'mobile_money', 'bank_transfer', 'cash', 'other'));
