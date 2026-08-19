/*
  # Hero Images Storage Bucket Setup

  ## Overview
  This migration creates a storage bucket for storing hero images with proper policies.

  ## New Storage Bucket
  
  ### `hero-images`
  - Storage bucket for hero images
  - Public read access for uploaded files
  - Authenticated users (admins) can upload files
*/

-- Create the hero-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- First, drop any existing policies on storage.objects to avoid conflicts
DROP POLICY IF EXISTS "Hero images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage hero images" ON storage.objects;

-- Policy for public to view hero images
CREATE POLICY "Hero images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'hero-images');

-- Policy for authenticated users to manage hero images
CREATE POLICY "Admins can manage hero images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'hero-images')
  WITH CHECK (bucket_id = 'hero-images');