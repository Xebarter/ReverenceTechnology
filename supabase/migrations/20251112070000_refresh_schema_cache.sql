/*
  # Refresh Schema Cache

  ## Overview
  This migration refreshes the Supabase schema cache to ensure all tables and policies are properly recognized.
*/

-- This will help refresh the schema cache
NOTIFY pgrst, 'reload schema';