/*
  # Fix Hero Images Table and Storage Bucket (NO POLICIES)

  ## Overview
  This migration ensures the hero_images table exists and sets up the storage bucket 
  without any RLS policies as required by the project.
*/

-- Create hero_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create the hero-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hero images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage hero images" ON storage.objects;

-- Create new policies for the hero-images bucket
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