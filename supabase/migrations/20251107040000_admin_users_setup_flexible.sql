-- Admin Users Setup (Flexible Version)
-- This script creates the admin_users table for role-based access control
-- It can be run even before users exist in auth.users table

-- Create admin_users table for role-based access control
-- Temporarily remove foreign key constraint to allow adding users before they exist in auth.users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY, -- Remove foreign key constraint temporarily
  email text NOT NULL UNIQUE,
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
-- Policy to allow users to read their own admin status
CREATE POLICY "Users can view their own admin status" 
ON admin_users FOR SELECT 
USING (auth.uid() = id);

-- Policy to allow admins to manage admin_users
CREATE POLICY "Admins can manage admin users" 
ON admin_users FOR ALL 
USING (EXISTS(
  SELECT 1 FROM admin_users 
  WHERE admin_users.id = auth.uid() 
  AND admin_users.is_active = true
));

-- Grant permissions
GRANT ALL ON TABLE admin_users TO authenticated;

-- Add function to get user by email from auth.users table
-- This is needed for the admin user management feature
CREATE OR REPLACE FUNCTION get_user_by_email(email_address TEXT)
RETURNS TABLE (
  id uuid,
  email TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$ LANGUAGE plpgsql;

-- Insert the specified admin users (they don't need to exist in auth.users yet)
INSERT INTO admin_users (id, email, full_name, is_active)
VALUES 
  -- Generate UUIDs for each user (these will be replaced when they sign up)
  (gen_random_uuid(), 'sebenock027@gmail.com', 'Sebenock', true),
  (gen_random_uuid(), 'reverencetechnology1@gmail.com', 'Reverence Technology', true),
  (gen_random_uuid(), 'edrinessemakula1@gmail.com', 'Edrine Ssemakula', true),
  (gen_random_uuid(), 'johnkiribata12@gmail.com', 'John Kiribata', true)
ON CONFLICT (email) DO NOTHING;

-- Note: After users sign up, you'll need to update their IDs to match the real auth.users IDs
-- This can be done automatically by the application or manually with UPDATE statements