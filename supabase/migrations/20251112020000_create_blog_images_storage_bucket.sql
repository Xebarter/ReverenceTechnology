/*
  # Blog Images Storage Bucket Setup

  ## Overview
  This migration creates a storage bucket for storing blog images with proper policies.

  ## New Storage Bucket
  
  ### `blog-images`
  - Storage bucket for blog images
  - Public read access for uploaded files
  - Authenticated users (admins) can upload files
*/

-- Create the blog-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- First, drop any existing policies on storage.objects to avoid conflicts
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;

-- Policy for public to view blog images
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

-- Policy for authenticated users to manage blog images
CREATE POLICY "Admins can manage blog images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');