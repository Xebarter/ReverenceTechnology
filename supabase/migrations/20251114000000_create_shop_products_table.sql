/*
  # Reverence Technology Database Migration
  
  ## Overview
  This migration creates the shop_products table for managing computer and computer accessories products
  in the shop section of the website.

  ## New Table: shop_products
  - id (uuid, primary key) - Unique identifier for each product
  - name (text) - Product name
  - description (text) - Detailed product description
  - price (numeric) - Product price in UGX
  - category (text) - Product category (e.g., 'Computer', 'Accessory', 'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', etc.)
  - image_url (text) - Product image URL
  - stock_quantity (integer) - Available stock quantity
  - is_featured (boolean) - Whether to feature in hero section
  - is_active (boolean) - Whether product is active/visible
  - display_order (integer) - Order for displaying products
  - specifications (jsonb) - Product specifications (e.g., RAM, Storage, Processor, etc.)
  - created_at (timestamptz) - Timestamp of creation
  - updated_at (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Public read access (anyone can view active products)
  - Admin read/write access (only admins can manage products)
*/

CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(12, 2) NOT NULL,
  category text NOT NULL,
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create update_updated_at trigger for shop_products
CREATE OR REPLACE FUNCTION update_shop_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON shop_products
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_products_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_is_featured ON shop_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_shop_products_display_order ON shop_products(display_order);
CREATE INDEX IF NOT EXISTS idx_shop_products_created_at ON shop_products(created_at);

-- Enable RLS on shop_products table
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON shop_products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policy: Admins can view all products (including inactive)
CREATE POLICY "Admins can view all products"
  ON shop_products
  FOR SELECT
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can insert products
CREATE POLICY "Admins can insert products"
  ON shop_products
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can update products
CREATE POLICY "Admins can update products"
  ON shop_products
  FOR UPDATE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can delete products
CREATE POLICY "Admins can delete products"
  ON shop_products
  FOR DELETE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

