/*
  # Resumes Storage Bucket Setup

  ## Overview
  This migration creates a storage bucket for storing applicant resumes.

  ## New Storage Bucket
  
  ### `resumes`
  - Storage bucket for applicant resumes
  - Public read access for uploaded files
  - Authenticated users can upload files
*/

-- Create the resumes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public to view resumes
CREATE POLICY "Resumes are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resumes');

-- Policy for authenticated users to insert resumes
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

-- Policy for authenticated users to update their resumes
CREATE POLICY "Authenticated users can update their resumes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

-- Policy for authenticated users to delete their resumes
CREATE POLICY "Authenticated users can delete their resumes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');