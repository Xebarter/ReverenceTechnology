/*
  # Fix Shop Products RLS Policies
  
  ## Problem
  The RLS policies for shop_products require Supabase Auth (auth.uid()), but the admin
  system uses custom authentication. This migration fixes the policies to allow
  authenticated users to manage products, or we can use service role key.
  
  ## Solution
  Since admins use custom auth, we'll allow authenticated users to manage products.
  In production, you should use the service role key (adminSupabase) for admin operations.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON shop_products;
DROP POLICY IF EXISTS "Admins can view all products" ON shop_products;
DROP POLICY IF EXISTS "Admins can insert products" ON shop_products;
DROP POLICY IF EXISTS "Admins can update products" ON shop_products;
DROP POLICY IF EXISTS "Admins can delete products" ON shop_products;

-- Policy: Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON shop_products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policy: Authenticated users can view all products (for admin dashboard)
-- This allows admins using custom auth to view all products
CREATE POLICY "Authenticated users can view all products"
  ON shop_products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert products
-- This allows admins using custom auth to create products
CREATE POLICY "Authenticated users can insert products"
  ON shop_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update products
-- This allows admins using custom auth to update products
CREATE POLICY "Authenticated users can update products"
  ON shop_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete products
-- This allows admins using custom auth to delete products
CREATE POLICY "Authenticated users can delete products"
  ON shop_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Note: For better security in production, consider:
-- 1. Using adminSupabase (service role key) for admin operations which bypasses RLS
-- 2. Implementing proper admin authentication with Supabase Auth
-- 3. Adding additional checks in your application code to verify admin status

