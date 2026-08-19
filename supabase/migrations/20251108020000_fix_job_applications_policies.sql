/*
  # Fix Job Applications Table Policies

  ## Overview
  This migration fixes the job_applications table policies by checking if they exist before creating them.
  This prevents the "policy already exists" error when running migrations.
*/

-- Check if the job_applications table exists, if not create it
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  status text DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table if not already enabled
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can manage job applications" ON job_applications;

-- Policy for admins to manage job applications
CREATE POLICY "Admins can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);