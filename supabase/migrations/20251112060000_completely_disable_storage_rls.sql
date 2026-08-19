-- Completely disable RLS on storage.objects table
-- This ensures that all storage operations work without row-level security restrictions

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;