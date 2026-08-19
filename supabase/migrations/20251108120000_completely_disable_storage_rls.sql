/*
  # Completely Disable Storage RLS and Remove All Policies

  ## Overview
  This migration completely removes all RLS policies from storage.objects 
  and disables RLS as required by the project.
*/

-- Check current RLS status
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'objects';

-- Drop ALL existing policies on storage.objects
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'objects';