-- Completely fix RLS policies for projects table
-- Enable RLS on projects table (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make this idempotent
DROP POLICY IF EXISTS "Featured projects are publicly readable" ON projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;

-- Policy for public to view featured projects
CREATE POLICY "Featured projects are publicly readable"
  ON projects
  FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

-- Policy for admins/authenticated users to manage projects
CREATE POLICY "Admins can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant all permissions on projects table to authenticated users
GRANT ALL ON TABLE projects TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';