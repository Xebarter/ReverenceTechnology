/*
  # Link orders to authenticated users

  ## Why
  After payment we create/attach a Supabase account so customers can view their purchased services/orders.

  ## What
  - Add `user_id` to `orders` referencing `auth.users(id)`
  - Backfill `user_id` where possible by matching `customer_email` to `auth.users.email`
  - Add RLS policy for authenticated users to view their own orders by `user_id`
  - Keep existing anon tracking flows intact
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'orders'
      AND tc.constraint_name = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE orders o
SET user_id = u.id
FROM auth.users u
WHERE o.user_id IS NULL
  AND lower(o.customer_email) = lower(u.email);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders (by user_id)" ON orders;

CREATE POLICY "Users can view own orders (by user_id)"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

