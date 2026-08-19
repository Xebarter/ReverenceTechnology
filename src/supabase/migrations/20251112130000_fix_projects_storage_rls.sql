-- Allow public uploads and reads for projects bucket
-- This policy permits any role (including anonymous/anon) to INSERT into storage.objects
-- for objects that belong to the `projects` bucket. It also allows SELECT so reads
-- (when RLS is enabled) will succeed for that bucket.

-- First, ensure the projects bucket exists
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