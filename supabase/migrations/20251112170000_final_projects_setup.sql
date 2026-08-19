-- Final setup for projects table
-- Enable RLS
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

-- Ensure the storage bucket is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Set file size limit to 10MB for projects bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/*'::text], 
    file_size_limit = 10485760 -- 10MB limit
WHERE id = 'projects';

-- Drop existing policies on storage.objects for projects to make this idempotent
DROP POLICY IF EXISTS "Public uploads to projects" ON storage.objects;
DROP POLICY IF EXISTS "Public reads of projects" ON storage.objects;

-- Allow anyone to upload to the projects bucket
CREATE POLICY "Public uploads to projects"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'projects');

-- Allow anyone to read objects metadata from the projects bucket
CREATE POLICY "Public reads of projects"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'projects');

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';