/*
  # Fix Jobs Table Policies

  ## Overview
  This migration fixes the jobs table policies by checking if they exist before creating them.
  This prevents the "policy already exists" error when running migrations.
*/

-- Check if the jobs table exists, if not create it
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  employment_type text NOT NULL,
  salary_range text,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  application_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table if not already enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist and recreate them
DROP POLICY IF EXISTS "Published jobs are publicly readable" ON jobs;
DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;

-- Policy for public to view published jobs
CREATE POLICY "Published jobs are publicly readable"
  ON jobs
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Policy for admins to manage jobs
CREATE POLICY "Admins can manage jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_jobs_is_published ON jobs(is_published);