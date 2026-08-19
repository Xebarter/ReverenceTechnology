/*
  # Reverence Technology Database Migration - Product Packages
  
  ## Overview
  This migration creates tables for product packages - allowing admins to bundle multiple products
  together and sell them as a single package.

  ## New Tables:
  
  ### 1. product_packages
  - id (uuid, primary key) - Unique identifier for each package
  - name (text) - Package name
  - description (text) - Detailed package description
  - price (numeric) - Package price in UGX (can be discounted from sum of products)
  - category (text) - Package category (e.g., 'Bundle', 'Starter Kit', 'Complete Setup')
  - image_url (text) - Package image URL
  - is_featured (boolean) - Whether to feature in hero section
  - is_active (boolean) - Whether package is active/visible
  - display_order (integer) - Order for displaying packages
  - specifications (jsonb) - Package specifications/features
  - created_at (timestamptz) - Timestamp of creation
  - updated_at (timestamptz) - Timestamp of last update

  ### 2. package_products
  - id (uuid, primary key) - Unique identifier
  - package_id (uuid) - Reference to product_packages
  - product_id (uuid) - Reference to shop_products
  - quantity (integer) - Number of this product in the package
  - created_at (timestamptz) - Timestamp of creation

  ## Security
  - Enable RLS on both tables
  - Public read access (anyone can view active packages and their contents)
  - Admin read/write access (only admins can manage packages)
*/

-- Create product_packages table
CREATE TABLE IF NOT EXISTS product_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(12, 2) NOT NULL,
  category text NOT NULL,
  image_url text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package_products junction table
CREATE TABLE IF NOT EXISTS package_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES product_packages(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(package_id, product_id)
);

-- Create update_updated_at trigger for product_packages
CREATE OR REPLACE FUNCTION update_product_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_packages_updated_at
  BEFORE UPDATE ON product_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_product_packages_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_packages_category ON product_packages(category);
CREATE INDEX IF NOT EXISTS idx_product_packages_is_active ON product_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_product_packages_is_featured ON product_packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_packages_display_order ON product_packages(display_order);
CREATE INDEX IF NOT EXISTS idx_product_packages_created_at ON product_packages(created_at);
CREATE INDEX IF NOT EXISTS idx_package_products_package_id ON package_products(package_id);
CREATE INDEX IF NOT EXISTS idx_package_products_product_id ON package_products(product_id);

-- Enable RLS on product_packages table
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on package_products table
ALTER TABLE package_products ENABLE ROW LEVEL SECURITY;

-- Policies for product_packages

-- Policy: Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
  ON product_packages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policy: Admins can view all packages (including inactive)
CREATE POLICY "Admins can view all packages"
  ON product_packages
  FOR SELECT
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can insert packages
CREATE POLICY "Admins can insert packages"
  ON product_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can update packages
CREATE POLICY "Admins can update packages"
  ON product_packages
  FOR UPDATE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can delete packages
CREATE POLICY "Admins can delete packages"
  ON product_packages
  FOR DELETE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for package_products

-- Policy: Anyone can view package products for active packages
CREATE POLICY "Anyone can view package products"
  ON package_products
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS(
    SELECT 1 FROM product_packages
    WHERE product_packages.id = package_products.package_id
    AND product_packages.is_active = true
  ));

-- Policy: Admins can view all package products
CREATE POLICY "Admins can view all package products"
  ON package_products
  FOR SELECT
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can insert package products
CREATE POLICY "Admins can insert package products"
  ON package_products
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can update package products
CREATE POLICY "Admins can update package products"
  ON package_products
  FOR UPDATE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy: Admins can delete package products
CREATE POLICY "Admins can delete package products"
  ON package_products
  FOR DELETE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));
