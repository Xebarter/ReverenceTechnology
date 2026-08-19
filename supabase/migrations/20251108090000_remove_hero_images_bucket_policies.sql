/*
  # Remove Hero Images Storage Bucket Policies

  ## Overview
  This migration removes policies from the hero-images storage bucket.

  ## Storage Bucket
  
  ### `hero-images`
  - Storage bucket for hero images
  - Public read access for uploaded files
  - Authenticated users (admins) can manage files
  - NO POLICIES - No RLS restrictions
*/

-- Create the hero-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hero images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage hero images" ON storage.objects;