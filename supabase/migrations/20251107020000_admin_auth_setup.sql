-- Comprehensive Admin Authentication Setup
-- This script creates all necessary tables, functions, and policies for admin authentication

-- Create admin_users table for role-based access control
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Insert a default admin user (replace 'admin@example.com' with your actual admin email)
-- Uncomment and modify the following lines to add your first admin user:
-- INSERT INTO admin_users (id, email, full_name, is_active)
-- SELECT id, email, 'Admin User', true 
-- FROM auth.users 
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (email) DO UPDATE SET is_active = true;