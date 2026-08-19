-- Allow public uploads and reads for resumes bucket
-- This policy permits any role (including anonymous/anon) to INSERT into storage.objects
-- for objects that belong to the `resumes` bucket. It also allows SELECT so reads
-- (when RLS is enabled) will succeed for that bucket.

-- First, ensure the resumes bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Drop if they already exist to make this idempotent
DROP POLICY IF EXISTS "Public uploads to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public reads of resumes" ON storage.objects;
DROP POLICY IF EXISTS "Resumes are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their resumes" ON storage.objects;

-- Allow anyone to upload to the resumes bucket
CREATE POLICY "Public uploads to resumes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to read objects metadata from the resumes bucket
CREATE POLICY "Public reads of resumes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resumes');