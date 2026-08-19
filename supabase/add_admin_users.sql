-- Add admin users to the admin_users table
-- This script should be run after the users have registered through the Supabase Auth system

-- First, you need to get the user IDs from auth.users table for each admin
-- You can do this by running SELECT id, email FROM auth.users; after users register

-- Example of how to add admin users (replace the UUIDs with actual user IDs from auth.users):
-- INSERT INTO admin_users (id, email, full_name, is_active)
-- VALUES 
--   ('actual-uuid-from-auth-users-1', 'reverencetechnology1@gmail.com', 'Reverence Technology Admin', true),
--   ('actual-uuid-from-auth-users-2', 'sebenock027@gmail.com', 'Sebenock Admin', true),
--   ('actual-uuid-from-auth-users-3', 'edrinessemakula1@gmail.com', 'Edrine Ssemakula Admin', true),
--   ('actual-uuid-from-auth-users-4', 'johnkiribata12@gmail.com', 'John Kiribata Admin', true);

-- Alternative approach: If you want to add the users before they register, you can use gen_random_uuid()
-- but you'll need to update the IDs later when they register through the auth system
INSERT INTO admin_users (id, email, full_name, is_active)
VALUES 
  (gen_random_uuid(), 'reverencetechnology1@gmail.com', 'Reverence Technology Admin', true),
  (gen_random_uuid(), 'sebenock027@gmail.com', 'Sebenock Admin', true),
  (gen_random_uuid(), 'edrinessemakula1@gmail.com', 'Edrine Ssemakula Admin', true),
  (gen_random_uuid(), 'johnkiribata12@gmail.com', 'John Kiribata Admin', true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active;