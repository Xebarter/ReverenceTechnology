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

-- Create policy to allow users to read their own admin status
CREATE POLICY "Users can view their own admin status" 
ON admin_users FOR SELECT 
USING (auth.uid() = id);

-- Create policy to allow admins to manage admin_users
CREATE POLICY "Admins can manage admin users" 
ON admin_users FOR ALL 
USING (EXISTS(
  SELECT 1 FROM admin_users 
  WHERE admin_users.id = auth.uid() 
  AND admin_users.is_active = true
));

-- Grant permissions
GRANT ALL ON TABLE admin_users TO authenticated;

-- Insert a default admin user (replace with your actual email)
-- INSERT INTO admin_users (id, email, full_name, is_active)
-- SELECT id, email, 'Admin User', true 
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com';