/*
  # Reverence Technology Database Migration
  
  ## Overview
  This migration creates the scheduled_calls table for managing FAQ section call scheduling requests.
  These are calls that users schedule through the FAQ section for more information or consultation.

  ## New Table: scheduled_calls
  - id (uuid, primary key) - Unique identifier for each call request
  - full_name (text) - User's full name
  - email (text) - User's email address
  - phone (text) - User's phone number (optional)
  - company (text) - User's company (optional)
  - preferred_date (timestamptz) - User's preferred date for the call
  - preferred_time (text) - User's preferred time slot for the call
  - call_reason (text) - Reason for the call / specific FAQ item (optional)
  - status (text) - Status of the call request (new, scheduled, completed, cancelled)
  - notes (text) - Additional notes from admin or user
  - scheduled_at (timestamptz) - Actual scheduled time once confirmed by admin
  - created_at (timestamptz) - Timestamp of request submission
  - updated_at (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on the table
  - Public insert access (anyone can request a call)
  - Admin read/write access (only admins can modify status, schedule, etc.)
*/

CREATE TABLE IF NOT EXISTS scheduled_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  preferred_date timestamptz,
  preferred_time text,
  call_reason text,
  status text DEFAULT 'new',
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create update_updated_at trigger for scheduled_calls
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_calls_updated_at
  BEFORE UPDATE ON scheduled_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_created_at ON scheduled_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_at ON scheduled_calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_preferred_date ON scheduled_calls(preferred_date);

-- Enable RLS on scheduled_calls table
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a scheduled call request
CREATE POLICY "Users can create scheduled call requests"
  ON scheduled_calls
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Admins can view and manage scheduled calls
CREATE POLICY "Admins can view and manage scheduled calls"
  ON scheduled_calls
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));