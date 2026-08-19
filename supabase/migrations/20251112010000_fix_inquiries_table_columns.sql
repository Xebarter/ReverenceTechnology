-- Fix inquiries table column names to match the frontend interface
-- The frontend uses different column names than what's in the database

-- Add missing columns that match the frontend interface
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'company_name') THEN
    ALTER TABLE inquiries ADD COLUMN company_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'phone_number') THEN
    ALTER TABLE inquiries ADD COLUMN phone_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'interested_package') THEN
    ALTER TABLE inquiries ADD COLUMN interested_package TEXT;
  END IF;
END $$;

-- Copy data from old columns to new ones
UPDATE inquiries 
SET company_name = company,
    phone_number = phone,
    interested_package = service_interest
WHERE company_name IS NULL OR phone_number IS NULL OR interested_package IS NULL;

-- Update the policy to ensure public inserts work
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON inquiries;

CREATE POLICY "Anyone can submit inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);