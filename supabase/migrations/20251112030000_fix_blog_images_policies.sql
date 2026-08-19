/*
  # Fix Blog Images Policies

  ## Overview
  This migration ensures that blog images policies are correctly set and RLS is properly handled.
*/

-- First drop any existing policies on storage.objects for blog images
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;

-- Recreate policies for blog images
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can manage blog images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');