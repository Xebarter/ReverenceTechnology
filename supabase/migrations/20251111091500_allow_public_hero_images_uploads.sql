-- Allow public uploads and reads for hero-images bucket
-- This policy permits any role (including anonymous/anon) to INSERT into storage.objects
-- for objects that belong to the `hero-images` bucket. It also allows SELECT so reads
-- (when RLS is enabled) will succeed for that bucket.

-- Drop if they already exist to make this idempotent
DROP POLICY IF EXISTS "Public uploads to hero-images" ON storage.objects;
DROP POLICY IF EXISTS "Public reads of hero-images" ON storage.objects;

-- Allow anyone to upload to the hero-images bucket
CREATE POLICY "Public uploads to hero-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'hero-images');

-- Allow anyone to read objects metadata from the hero-images bucket
CREATE POLICY "Public reads of hero-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'hero-images');
