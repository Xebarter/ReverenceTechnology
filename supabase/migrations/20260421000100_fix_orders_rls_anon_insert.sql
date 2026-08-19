-- Fix: grant anon role INSERT privilege on orders and ensure the INSERT RLS
-- policy is present. The original create_orders_table migration only granted
-- privileges to `authenticated`, leaving `anon` unable to insert despite the
-- "Anyone can create orders" RLS policy (PostgreSQL enforces both the privilege
-- and the RLS check).

-- 1. Grant the minimum required privileges so PostgREST can expose the table
--    to unauthenticated (anon) requests.
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON TABLE public.orders TO anon;
GRANT SELECT ON TABLE public.orders TO anon;

-- 2. Re-create the INSERT policy idempotently to be sure it is present.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Re-create the SELECT policy so customers can read back their own row
--    immediately after insert (needed by `.select()` after `.insert()`).
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (
    customer_email = current_setting('app.customer_email', true)
    OR customer_phone = current_setting('app.customer_phone', true)
    OR status_token  = current_setting('app.status_token',  true)
  );
