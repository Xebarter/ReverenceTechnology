/*
  # Refresh Schema Cache

  ## Overview
  This migration notifies PostgREST to refresh the schema cache to ensure all changes are properly applied.
*/

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';