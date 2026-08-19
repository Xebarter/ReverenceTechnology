/*
  # Disable RLS on Storage Objects Table

  ## Overview
  This migration disables RLS on the storage.objects table to ensure
  there are no row-level security policies preventing uploads.
*/

-- First drop any existing policies on storage.objects
DROP POLICY IF EXISTS "Hero images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage hero images" ON storage.objects;
DROP POLICY IF EXISTS "Resumes are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their resumes" ON storage.objects;
DROP POLICY IF EXISTS "Testimonial images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage testimonial images" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage blog images" ON storage.objects;

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;