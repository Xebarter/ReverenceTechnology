/*
  # Add Schema Reload Function

  ## Overview
  This migration adds a helper function to reload the PostgREST schema cache.
*/

-- Create or replace function to reload the schema
CREATE OR REPLACE FUNCTION reload_schema()
RETURNS void AS $$
BEGIN
  -- Notify PostgREST to reload the schema
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;