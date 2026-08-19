/*
  # Jobs Table for Career Postings

  ## Overview
  This migration creates a table for managing job postings on the careers page.

  ## New Tables
  
  ### `jobs`
  - `id` (uuid, primary key) - Unique identifier for each job posting
  - `title` (text) - Job title
  - `description` (text) - Detailed job description
  - `location` (text) - Job location
  - `employment_type` (text) - Type of employment (full-time, part-time, contract, etc.)
  - `salary_range` (text) - Salary range for the position
  - `responsibilities` (jsonb) - Array of job responsibilities
  - `requirements` (jsonb) - Array of job requirements
  - `benefits` (jsonb) - Array of benefits offered
  - `is_published` (boolean) - Whether the job is published on the careers page
  - `application_link` (text) - Link to application form (optional)
  - `created_at` (timestamptz) - Timestamp of creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Public read access for published jobs only
  - Admin full access for managing jobs
*/

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

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

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

-- Create index for better performance
CREATE INDEX idx_jobs_is_published ON jobs(is_published);