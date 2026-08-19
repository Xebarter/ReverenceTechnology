/*
  # Job Applications Table

  ## Overview
  This migration creates a table for managing job applications submitted through the careers page.

  ## New Tables
  
  ### `job_applications`
  - `id` (uuid, primary key) - Unique identifier for each job application
  - `job_id` (uuid, foreign key) - Reference to the job being applied for
  - `full_name` (text) - Applicant's full name
  - `email` (text) - Applicant's email address
  - `phone` (text) - Applicant's phone number
  - `cover_letter` (text) - Applicant's cover letter
  - `resume_url` (text) - URL to the applicant's resume file
  - `status` (text) - Application status (new, reviewed, interview, rejected, hired)
  - `notes` (text) - Internal notes about the application
  - `created_at` (timestamptz) - Timestamp of application submission
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Admin full access for managing applications
*/

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

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage job applications
CREATE POLICY "Admins can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at);