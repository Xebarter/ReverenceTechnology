/*
  # Reverence Technology Database Migration
  
  ## Overview
  This migration creates the orders table for managing customer orders/checkout
  for computers and accessories. This is separate from deposits - orders are
  for immediate purchases.

  ## New Table: orders
  - id (uuid, primary key) - Unique identifier for each order
  - order_number (text) - Unique order number (e.g., ORD-2025-001)
  - customer_name (text) - Customer's full name
  - customer_email (text) - Customer's email address
  - customer_phone (text) - Customer's phone number
  - shipping_address (text) - Delivery/shipping address
  - city (text) - City
  - country (text) - Country (default: Uganda)
  - payment_method (text) - Payment method: 'mobile_money', 'bank_transfer', 'cash', 'other'
  - payment_status (text) - Payment status: 'pending', 'paid', 'failed', 'refunded'
  - payment_reference (text) - Payment reference/transaction ID
  - order_status (text) - Order status: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  - total_amount (numeric) - Total order amount
  - shipping_fee (numeric) - Shipping/delivery fee
  - items (jsonb) - Array of order items with product details
  - notes (text) - Customer notes
  - admin_notes (text) - Internal admin notes
  - tracking_number (text) - Shipping tracking number
  - shipped_at (timestamptz) - When order was shipped
  - delivered_at (timestamptz) - When order was delivered
  - created_at (timestamptz) - Timestamp of creation
  - updated_at (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Customers can view their own orders (by email/phone)
  - Customers can create orders
  - Admins can view and manage all orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  city text NOT NULL,
  country text DEFAULT 'Uganda',
  payment_method text NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'other')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) NOT NULL,
  shipping_fee numeric(12, 2) DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  admin_notes text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  order_count INTEGER;
BEGIN
  -- Get count of orders today
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate order number: ORD-YYYY-MMDD-NNNN
  new_order_number := 'ORD-' || 
    TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
    TO_CHAR(CURRENT_DATE, 'MMDD') || '-' ||
    LPAD((order_count + 1)::TEXT, 4, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create update_updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own orders (by email or phone)
CREATE POLICY "Customers can view their own orders"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (
    customer_email = current_setting('app.customer_email', true) OR
    customer_phone = current_setting('app.customer_phone', true)
  );

-- Policy: Anyone can create orders
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can view all orders (for admin)
CREATE POLICY "Authenticated users can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update orders (for admin)
CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete orders (for admin)
CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

