-- Allow public uploads and reads for testimonials bucket
-- This policy permits any role (including anonymous/anon) to INSERT into storage.objects
-- for objects that belong to the `testimonials` bucket. It also allows SELECT so reads
-- (when RLS is enabled) will succeed for that bucket.

-- First, ensure the testimonials bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Drop if they already exist to make this idempotent
DROP POLICY IF EXISTS "Public uploads to testimonials" ON storage.objects;
DROP POLICY IF EXISTS "Public reads of testimonials" ON storage.objects;

-- Allow anyone to upload to the testimonials bucket
CREATE POLICY "Public uploads to testimonials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'testimonials');

-- Allow anyone to read objects metadata from the testimonials bucket
CREATE POLICY "Public reads of testimonials"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'testimonials');