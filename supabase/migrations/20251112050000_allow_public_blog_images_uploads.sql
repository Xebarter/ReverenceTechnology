-- Allow public uploads and reads for blog-images bucket
-- This policy permits any role (including anonymous/anon) to INSERT into storage.objects
-- for objects that belong to the `blog-images` bucket. It also allows SELECT so reads
-- (when RLS is enabled) will succeed for that bucket.

-- First, ensure the blog-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies on storage.objects for blog-images to make this idempotent
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public uploads to blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Public reads of blog-images" ON storage.objects;

-- Allow anyone to upload to the blog-images bucket
CREATE POLICY "Public uploads to blog-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'blog-images');

-- Allow anyone to read objects metadata from the blog-images bucket
CREATE POLICY "Public reads of blog-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');