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