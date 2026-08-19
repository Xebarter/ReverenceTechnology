-- Fix RLS policies for projects table to ensure authenticated admins can manage projects
-- The existing policy is correct, but we're ensuring it's properly configured

-- Drop existing policies to make this idempotent
DROP POLICY IF EXISTS "Featured projects are publicly readable" ON projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;

-- Policy for public to view featured projects
CREATE POLICY "Featured projects are publicly readable"
  ON projects
  FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

-- Policy for admins to manage projects
-- This ensures authenticated users can perform all operations on projects
CREATE POLICY "Admins can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);