/*
  # Reverence Technology Database Migration
  
  ## Overview
  This migration creates the customer_deposits table for managing customer deposits
  on computers and accessories. Customers can make deposits and track their progress
  toward full payment.

  ## New Table: customer_deposits
  - id (uuid, primary key) - Unique identifier for each deposit
  - customer_name (text) - Customer's full name
  - customer_email (text) - Customer's email address
  - customer_phone (text) - Customer's phone number
  - product_id (uuid) - Reference to shop_products table
  - product_name (text) - Product name (denormalized for history)
  - product_price (numeric) - Product price at time of deposit (denormalized)
  - deposit_amount (numeric) - Amount of this deposit
  - total_deposited (numeric) - Total amount deposited so far
  - remaining_balance (numeric) - Remaining balance to pay
  - status (text) - Status: 'pending', 'confirmed', 'completed', 'cancelled'
  - payment_method (text) - Payment method: 'mobile_money', 'bank_transfer', 'cash', 'other'
  - payment_reference (text) - Payment reference/transaction ID
  - notes (text) - Additional notes from customer or admin
  - admin_notes (text) - Internal admin notes
  - deposit_date (timestamptz) - Date of deposit
  - expected_completion_date (timestamptz) - Expected completion date
  - completed_at (timestamptz) - When payment was completed
  - created_at (timestamptz) - Timestamp of creation
  - updated_at (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Customers can view their own deposits (by email/phone)
  - Customers can create deposits
  - Admins can view and manage all deposits
*/

CREATE TABLE IF NOT EXISTS customer_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  product_id uuid REFERENCES shop_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(12, 2) NOT NULL,
  deposit_amount numeric(12, 2) NOT NULL,
  total_deposited numeric(12, 2) NOT NULL DEFAULT 0,
  remaining_balance numeric(12, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'other')),
  payment_reference text,
  notes text,
  admin_notes text,
  deposit_date timestamptz DEFAULT now(),
  expected_completion_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create update_updated_at trigger for customer_deposits
CREATE OR REPLACE FUNCTION update_customer_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_deposits_updated_at
  BEFORE UPDATE ON customer_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_deposits_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_deposits_email ON customer_deposits(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_deposits_phone ON customer_deposits(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_deposits_product_id ON customer_deposits(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_deposits_status ON customer_deposits(status);
CREATE INDEX IF NOT EXISTS idx_customer_deposits_created_at ON customer_deposits(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_deposits_deposit_date ON customer_deposits(deposit_date);

-- Enable RLS on customer_deposits table
ALTER TABLE customer_deposits ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own deposits (by email or phone)
CREATE POLICY "Customers can view their own deposits"
  ON customer_deposits
  FOR SELECT
  TO anon, authenticated
  USING (
    customer_email = current_setting('app.customer_email', true) OR
    customer_phone = current_setting('app.customer_phone', true)
  );

-- Policy: Anyone can create deposits
CREATE POLICY "Anyone can create deposits"
  ON customer_deposits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
  ON customer_deposits
  FOR SELECT
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can update deposits
CREATE POLICY "Admins can update deposits"
  ON customer_deposits
  FOR UPDATE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can delete deposits
CREATE POLICY "Admins can delete deposits"
  ON customer_deposits
  FOR DELETE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

